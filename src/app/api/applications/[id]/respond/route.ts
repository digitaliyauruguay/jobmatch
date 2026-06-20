/*
 * Archivo: src/app/api/applications/[id]/respond/route.ts
 * Qué hace: Permite al trabajador aceptar o rechazar una indicación
 * que recibió de una empresa (origin: INDICATED). Solo aplica a
 * postulaciones con origen INDICATED y estado PENDING.
 * Notifica a la empresa con notificación interna y email del resultado.
 * Solo accesible por el trabajador indicado.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { status, reason } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: { include: { user: true } },
          },
        },
      },
    });

    if (!application || application.workerId !== worker.id) {
      return NextResponse.json(
        { error: "La indicación no existe o no te pertenece" },
        { status: 404 }
      );
    }

    if (application.origin !== "INDICATED") {
      return NextResponse.json(
        { error: "Esta acción solo aplica a indicaciones" },
        { status: 400 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta indicación ya fue respondida" },
        { status: 409 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // Notificar a la empresa
    const messages: Record<string, string> = {
      APPROVED: `${worker.firstName} ${worker.lastName} aceptó tu indicación para "${application.job.title}".`,
      REJECTED: `${worker.firstName} ${worker.lastName} rechazó tu indicación para "${application.job.title}".${reason ? ` Motivo: ${reason}` : ""}`,
    };

    await prisma.notification.create({
      data: {
        userId: application.job.company.user.id,
        message: messages[status],
      },
    });

    if (status === "APPROVED") {
  await sendMail({
    to: application.job.company.user.email,
    subject: `¡Indicación aceptada! — JobMatch Uruguay`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">¡Indicación aceptada!</h2>
        <p>Hola ${application.job.company.name},</p>
        <p>${messages[status]}</p>
      </div>
    `,
  });
}
// REJECTED: solo notificación interna, sin email

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al responder indicación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}