/*
 * Archivo: src/app/api/applications/indicate/route.ts
 * Qué hace: Permite a una empresa indicar proactivamente un trabajador
 * para una de sus ofertas publicadas (origin: INDICATED).
 * Notifica al trabajador solo con notificación interna — el trabajador
 * lo ve en su dashboard sin necesidad de email.
 * Solo accesible por empresas activas.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
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

    const { jobId, workerId } = await req.json();

    if (!jobId || !workerId) {
      return NextResponse.json(
        { error: "El ID de la oferta y del trabajador son requeridos" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.companyId !== company.id || job.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "La oferta no existe o no te pertenece" },
        { status: 404 }
      );
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "El trabajador no existe" },
        { status: 404 }
      );
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_workerId: { jobId, workerId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este trabajador ya está postulado a esta oferta" },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        workerId,
        origin: "INDICATED",
        status: "PENDING",
      },
    });

    // Solo notificación interna — el trabajador lo ve en su dashboard
    await prisma.notification.create({
      data: {
        userId: worker.user.id,
        message: `La empresa "${company.name}" te indicó para la oferta "${job.title}".`,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error al indicar trabajador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}