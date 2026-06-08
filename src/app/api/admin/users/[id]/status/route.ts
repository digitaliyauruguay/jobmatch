/*
 * Archivo: src/app/api/admin/users/[id]/status/route.ts
 * Qué hace: Permite al administrador cambiar el estado de un usuario.
 * PATCH - actualiza el estado a ACTIVE, INACTIVE o BLOCKED.
 * Cuando se aprueba o bloquea un usuario se le envía una notificación
 * interna y un email. Solo accesible por el administrador.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { emailUserApproved, emailUserBlocked } from "@/lib/emails";

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

    if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      include: {
        workerProfile: true,
        companyProfile: true,
      },
    });

    const firstName =
      user.workerProfile?.firstName ||
      user.companyProfile?.name ||
      "Usuario";

    // Notificación interna
    const messages: Record<string, string> = {
      ACTIVE: "Tu cuenta fue aprobada. Ya podés usar la plataforma.",
      INACTIVE: "Tu cuenta fue desactivada.",
      BLOCKED: "Tu cuenta fue bloqueada. Contactá al administrador.",
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        message: messages[status],
      },
    });

    // Email
    if (status === "ACTIVE") {
      const emailData = emailUserApproved(firstName);
      await sendMail({ to: user.email, ...emailData });
    } else if (status === "BLOCKED") {
      const emailData = emailUserBlocked(firstName, message);
      await sendMail({ to: user.email, ...emailData });
    }

    return NextResponse.json({ message: "Estado actualizado", user });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}