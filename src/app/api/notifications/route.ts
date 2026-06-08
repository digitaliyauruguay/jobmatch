/*
 * Archivo: src/app/api/notifications/route.ts
 * Qué hace: Devuelve todas las notificaciones del usuario autenticado
 * ordenadas por fecha, las más recientes primero.
 * Solo accesible por usuarios autenticados.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: token.id as string },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}