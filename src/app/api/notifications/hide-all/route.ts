/*
 * Archivo: src/app/api/notifications/hide-all/route.ts
 * Qué hace: Marca todas las notificaciones visibles del usuario
 * autenticado como hidden en una sola operación (borrado virtual,
 * los registros se conservan en la DB).
 * Solo accesible por usuarios autenticados.
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
        hidden: false,
      },
      data: { hidden: true },
    });

    return NextResponse.json({ message: "Todas las notificaciones ocultadas" });
  } catch (error) {
    console.error("Error al ocultar notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}