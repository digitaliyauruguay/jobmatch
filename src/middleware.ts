/*
 * Archivo: src/middleware.ts
 * Qué hace: Protege las rutas de la aplicación según el rol del usuario.
 * Antes de que cualquier página cargue, verifica si el usuario está
 * autenticado y si tiene el rol correcto. El status del usuario se
 * verifica en el JWT callback de NextAuth (cada 60s) — ya no necesitamos
 * un fetch interno desde el middleware Edge, que no puede usar Prisma.
 * También aplica rate limiting por IP en los endpoints críticos de auth.
 */

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting en memoria por IP
type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/signin":          { max: 10, windowMs: 60_000 },
  "/api/auth/register":        { max: 5,  windowMs: 60_000 },
  "/api/auth/forgot-password": { max: 5,  windowMs: 60_000 },
  "/api/auth/reset-password":  { max: 5,  windowMs: 60_000 },
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

function pruneExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  pruneExpiredEntries();

  // Rate limiting en endpoints de auth
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

  // Rutas protegidas — verificar rol y status desde el token JWT
  // El status se re-verifica en DB cada 60s via JWT callback de NextAuth
  if (pathname.startsWith("/worker/")) {
    if (!token || token.role !== "WORKER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Solo forzar logout si el status es explícitamente BLOCKED o INACTIVE
    // Si es undefined/desconocido, dejar pasar para no romper sesiones válidas
    if (token.status === "BLOCKED" || token.status === "INACTIVE") {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }
  }

  if (pathname.startsWith("/company/")) {
    if (!token || token.role !== "COMPANY") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.status === "BLOCKED" || token.status === "INACTIVE") {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }
  }

  if (pathname.startsWith("/admin/")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirigir usuarios ya logueados fuera de páginas de auth
  // Solo si el status es ACTIVE — si está bloqueado/inactivo debe poder ver el login
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token && token.status === "ACTIVE") {
      if (token.role === "WORKER") return NextResponse.redirect(new URL("/worker/dashboard", req.url));
      if (token.role === "COMPANY") return NextResponse.redirect(new URL("/company/dashboard", req.url));
      if (token.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
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