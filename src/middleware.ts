/*
 * Archivo: src/middleware.ts
 * Qué hace: Protege las rutas de la aplicación según el rol del usuario.
 * Antes de que cualquier página cargue, este archivo verifica si el usuario
 * está autenticado, si tiene el rol correcto, y si su cuenta sigue activa
 * en la base de datos. Si fue bloqueado o desactivado mientras tenía
 * sesión abierta, se le fuerza el cierre de sesión inmediatamente.
 */

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

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
  ],
};