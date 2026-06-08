/*
 * Archivo: src/app/api/applications/me/route.ts
 * Qué hace: Devuelve todas las postulaciones del trabajador autenticado,
 * tanto las que hizo él mismo (SELF) como las indicaciones que recibió
 * de empresas (INDICATED). Incluye los datos de la oferta y la empresa.
 * Solo accesible por trabajadores.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "WORKER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: token.id as string },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "No tenés un perfil de trabajador" },
        { status: 404 }
      );
    }

    const applications = await prisma.application.findMany({
      where: { workerId: worker.id },
      include: {
        job: {
          include: {
            category: { select: { name: true } },
            company: { select: { name: true, department: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error al obtener postulaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}