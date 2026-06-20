/*
 * Archivo: src/app/api/applications/[id]/status/route.ts
 * Qué hace: Permite a una empresa aprobar o rechazar una postulación.
 * PATCH - actualiza el estado a APPROVED o REJECTED, notifica al
 * trabajador con notificación interna y email.
 * Solo la empresa dueña de la oferta puede modificar el estado.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { emailApplicationApproved, emailApplicationRejected } from "@/lib/emails";

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

    const { status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        worker: {
          include: { user: true },
        },
      },
    });

    if (!application || application.job.companyId !== company.id) {
      return NextResponse.json(
        { error: "La postulación no existe o no te pertenece" },
        { status: 404 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // Notificación interna al trabajador
    const notifMessages: Record<string, string> = {
      APPROVED: `Tu postulación para "${application.job.title}" fue aprobada. La empresa se pondrá en contacto con vos.`,
      REJECTED: `Tu postulación para "${application.job.title}" no fue seleccionada esta vez.`,
    };

    await prisma.notification.create({
      data: {
        userId: application.worker.user.id,
        message: notifMessages[status],
      },
    });

    // Email al trabajador
    if (status === "APPROVED") {
  const emailData = emailApplicationApproved(
    application.worker.firstName,
    application.job.title,
    application.job.company.name
  );
  await sendMail({ to: application.worker.user.email, ...emailData });
}
// REJECTED: solo notificación interna, sin email

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar postulación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}