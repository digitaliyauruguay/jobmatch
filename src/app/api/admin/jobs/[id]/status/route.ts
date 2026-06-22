/*
 * Archivo: src/app/api/admin/jobs/[id]/status/route.ts
 * Qué hace: Permite al administrador cambiar el estado de una oferta
 * de trabajo. PATCH - actualiza el estado a ACTIVE, BLOCKED o DELETED.
 * Cuando bloquea, crea un registro en Observation con el motivo para
 * que la empresa pueda verlo en el detalle de la oferta. Notifica a
 * la empresa con notificación interna y email. Solo accesible por
 * el administrador.
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

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { status, message } = await req.json();

    if (!["ACTIVE", "BLOCKED", "DELETED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id },
      data: { status },
      include: {
        company: {
          include: {
            user: true,
          },
        },
      },
    });

    // Registrar la observación con el motivo cuando se bloquea o elimina
    if ((status === "BLOCKED" || status === "DELETED") && message) {
      await prisma.observation.create({
        data: {
          message,
          targetType: "JOB",
          targetJobId: job.id,
          adminId: token.id as string,
        },
      });
    }

    // Notificación interna
    const defaultMessages: Record<string, string> = {
      BLOCKED: `Tu oferta "${job.title}" fue bloqueada por el administrador.${message ? ` Motivo: ${message}` : ""}`,
      DELETED: `Tu oferta "${job.title}" fue eliminada por el administrador.${message ? ` Motivo: ${message}` : ""}`,
      ACTIVE: `Tu oferta "${job.title}" fue reactivada.`,
    };

    await prisma.notification.create({
      data: {
        userId: job.company.user.id,
        message: defaultMessages[status],
      },
    });

    // Email
    const emailTemplates: Record<string, { subject: string; html: string }> = {
      BLOCKED: {
        subject: `Tu oferta fue bloqueada — JobMatch Uruguay`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Tu oferta fue bloqueada</h2>
            <p>Hola ${job.company.name},</p>
            <p>Tu oferta <strong>"${job.title}"</strong> fue bloqueada por el administrador.</p>
            ${message ? `<p><strong>Motivo:</strong> ${message}</p>` : ""}
            <p>Revisá el contenido y contactá al equipo si tenés dudas.</p>
          </div>
        `,
      },
      DELETED: {
        subject: `Tu oferta fue eliminada — JobMatch Uruguay`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Tu oferta fue eliminada</h2>
            <p>Hola ${job.company.name},</p>
            <p>Tu oferta <strong>"${job.title}"</strong> fue eliminada por el administrador.</p>
            ${message ? `<p><strong>Motivo:</strong> ${message}</p>` : ""}
            <p>Si tenés dudas, contactá al equipo.</p>
          </div>
        `,
      },
      ACTIVE: {
        subject: `Tu oferta fue reactivada — JobMatch Uruguay`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Tu oferta fue reactivada</h2>
            <p>Hola ${job.company.name},</p>
            <p>Tu oferta <strong>"${job.title}"</strong> fue reactivada y ya está visible para los trabajadores.</p>
          </div>
        `,
      },
    };

    await sendMail({
      to: job.company.user.email,
      ...emailTemplates[status],
    });

    return NextResponse.json({ message: "Estado actualizado", job });
  } catch (error) {
    console.error("Error al actualizar oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}