/*
 * Archivo: src/app/api/applications/job/[jobId]/route.ts
 * Qué hace: Devuelve todas las postulaciones recibidas para una oferta
 * específica de la empresa autenticada. Incluye los datos del trabajador
 * para que la empresa pueda evaluarlo. Discrimina entre postulaciones
 * propias (SELF) e indicaciones (INDICATED).
 * Solo accesible por la empresa dueña de la oferta.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "COMPANY") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const company = await prisma.companyProfile.findUnique({
      where: { userId: token.id as string },
    });

    if (!company) {
      return NextResponse.json(
        { error: "No tenés un perfil de empresa" },
        { status: 404 }
      );
    }

    // Verificar que la oferta pertenece a esta empresa
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.companyId !== company.id) {
      return NextResponse.json(
        { error: "La oferta no existe o no te pertenece" },
        { status: 404 }
      );
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        worker: {
          include: {
            categories: {
              include: { category: true },
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