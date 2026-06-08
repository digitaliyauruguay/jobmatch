/*
 * Archivo: src/proxy.ts
 * Qué hace: Protege las rutas de la aplicación según el rol del usuario.
 * Antes de que cualquier página cargue, este archivo verifica si el usuario
 * está autenticado y si tiene el rol correcto para acceder a esa ruta.
 * Si no cumple, lo redirige al login o a su dashboard correspondiente.
 */

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Rutas que solo puede ver un WORKER
  if (pathname.startsWith("/worker/")) {
    if (!token || token.role !== "WORKER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Rutas que solo puede ver una COMPANY
  if (pathname.startsWith("/company/")) {
    if (!token || token.role !== "COMPANY") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Rutas que solo puede ver el ADMIN
  if (pathname.startsWith("/admin/")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Si está logueado y trata de entrar al login o registro, lo mandamos a su dashboard
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
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
    "/admin/:path*",
    "/worker/:path*",
    "/company/:path*",
    "/login",
    "/register",
  ],
};