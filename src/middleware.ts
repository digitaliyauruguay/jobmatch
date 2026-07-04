/*
 * Archivo: src/middleware.ts
 * Qué hace: Protege las rutas de la aplicación según el rol del usuario.
 * Antes de que cualquier página cargue, verifica si el usuario está
 * autenticado, si tiene el rol correcto, y si su cuenta sigue activa
 * en la base de datos. Si fue bloqueado o desactivado mientras tenía
 * sesión abierta, se le fuerza el cierre de sesión inmediatamente.
 * También aplica rate limiting por IP en los endpoints críticos de auth
 * para proteger contra bots y ataques de fuerza bruta.
 */

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Rate limiting en memoria — Map por IP con ventana deslizante de 60 segundos.
// Nota: no se comparte entre instancias serverless de Vercel (limitación
// conocida y aceptada para el volumen actual). Migrar a Upstash/Redis si
// el tráfico escala significativamente.
// ---------------------------------------------------------------------------

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/signin":           { max: 10, windowMs: 60_000 },
  "/api/auth/register":         { max: 5,  windowMs: 60_000 },
  "/api/auth/forgot-password":  { max: 5,  windowMs: 60_000 },
  "/api/auth/reset-password":   { max: 5,  windowMs: 60_000 },
};

function getRealIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string, pathname: string): boolean {
  const limit = RATE_LIMITS[pathname];
  if (!limit) return false;

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + limit.windowMs });
    return false;
  }

  if (entry.count >= limit.max) return true;

  entry.count++;
  return false;
}

// Limpiar entradas expiradas periódicamente para evitar memory leak
function pruneExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Middleware principal
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Limpiar entradas expiradas en cada request (liviano, O(n) del store)
  pruneExpiredEntries();

  // Rate limiting — solo para endpoints de auth
  if (RATE_LIMITS[pathname]) {
    const ip = getRealIp(req);
    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un momento antes de intentar de nuevo." },
        { status: 429 }
      );
    }
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isProtectedRoute =
    pathname.startsWith("/worker/") ||
    pathname.startsWith("/company/") ||
    pathname.startsWith("/admin/");

  // Verificar estado actual en la base de datos para rutas protegidas
  if (isProtectedRoute && token) {
    try {
      const statusRes = await fetch(
        `${req.nextUrl.origin}/api/auth/verify-status?userId=${token.id}`
      );
      const statusData = await statusRes.json();

      if (statusData.status !== "ACTIVE") {
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        return response;
      }
    } catch (error) {
      console.error("Error verificando estado en middleware:", error);
    }
  }

  if (pathname.startsWith("/worker/")) {
    if (!token || token.role !== "WORKER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/company/")) {
    if (!token || token.role !== "COMPANY") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/admin/")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      if (token.role === "WORKER") {
        return NextResponse.redirect(new URL("/worker/dashboard", req.url));
      }
      if (token.role === "COMPANY") {
        return NextResponse.redirect(new URL("/company/dashboard", req.url));
      }
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/worker/:path*",
    "/company/:path*",
    "/login",
    "/register",
    "/api/auth/signin",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ],
};