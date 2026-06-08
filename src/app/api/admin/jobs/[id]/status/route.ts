/*
 * Archivo: src/app/api/admin/jobs/[id]/status/route.ts
 * Qué hace: Permite al administrador cambiar el estado de una oferta
 * de trabajo. PATCH - actualiza el estado a ACTIVE, BLOCKED o DELETED.
 * Notifica a la empresa cuando su oferta es bloqueada o eliminada.
 * Solo accesible por el administrador.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { status, message } = await req.json();

    if (!["ACTIVE", "BLOCKED", "DELETED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id: id },
      data: { status },
      include: {
        company: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notificar a la empresa
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

    return NextResponse.json({ message: "Estado actualizado", job });
  } catch (error) {
    console.error("Error al actualizar oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}