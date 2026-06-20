/*
 * Archivo: src/app/api/jobs/[id]/complete/route.ts
 * Qué hace: Permite a la empresa marcar una oferta como completada
 * cuando ya contrató a uno o más trabajadores. Notifica a los
 * postulados en estado PENDING que el puesto ya fue cubierto.
 * Solo la empresa dueña de la oferta puede hacerlo.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.companyId !== company.id) {
      return NextResponse.json(
        { error: "La oferta no existe o no te pertenece" },
        { status: 404 }
      );
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    // Notificar a postulados pendientes que el puesto ya fue cubierto
    const pendingApplications = await prisma.application.findMany({
      where: { jobId: id, status: "PENDING" },
      include: { worker: true },
    });

    for (const app of pendingApplications) {
      await prisma.notification.create({
        data: {
          userId: app.worker.userId,
          message: `La oferta "${updated.title}" ya fue cubierta por la empresa. Gracias por tu interés.`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al completar oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}