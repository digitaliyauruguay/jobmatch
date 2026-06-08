/*
 * Archivo: src/app/api/notifications/read-all/route.ts
 * Qué hace: Marca todas las notificaciones del usuario autenticado
 * como leídas en una sola operación. Se usa cuando el usuario
 * abre el centro de notificaciones. Solo accesible por usuarios autenticados.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: token.id as string,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}