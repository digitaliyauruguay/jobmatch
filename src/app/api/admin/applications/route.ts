/*
 * Archivo: src/app/api/admin/applications/route.ts
 * Qué hace: Devuelve todas las postulaciones de la plataforma
 * para el panel de administración. Incluye datos del trabajador,
 * la oferta y la empresa. Permite filtrar por estado y origen.
 * Solo accesible por el administrador.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const origin = searchParams.get("origin");

    const applications = await prisma.application.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(origin ? { origin: origin as any } : {}),
      },
      include: {
        worker: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
          },
        },
        job: {
          select: {
            title: true,
            company: {
              select: { name: true },
            },
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