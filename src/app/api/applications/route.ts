/*
 * Archivo: src/app/api/applications/route.ts
 * Qué hace: Maneja las postulaciones a ofertas de trabajo.
 * POST - crea una postulación propia (origin: SELF) cuando un trabajador
 * se postula a una oferta. Verifica que no esté ya postulado, notifica
 * a la empresa con notificación interna y email.
 * Solo accesible por trabajadores activos.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "El ID de la oferta es requerido" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          include: { user: true },
        },
      },
    });

    if (!job || job.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "La oferta no existe o no está disponible" },
        { status: 404 }
      );
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_workerId: { jobId, workerId: worker.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya te postulaste a esta oferta" },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        workerId: worker.id,
        origin: "SELF",
        status: "PENDING",
      },
    });

    // Notificación interna a la empresa
    // Solo notificación interna a la empresa, sin email
await prisma.notification.create({
  data: {
    userId: job.company.user.id,
    message: `Tenés una nueva postulación para la oferta "${job.title}".`,
  },
});

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error al crear postulación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}