/*
 * Archivo: src/app/api/auth/verify-status/route.ts
 * Qué hace: Devuelve el estado actual de un usuario consultando
 * directamente la base de datos. Lo usa el middleware para verificar
 * en cada request si un usuario sigue activo, permitiendo forzar
 * el cierre de sesión inmediato si fue bloqueado o desactivado
 * mientras tenía una sesión abierta.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    return NextResponse.json({ status: user.status });
  } catch (error) {
    console.error("Error al verificar estado:", error);
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}