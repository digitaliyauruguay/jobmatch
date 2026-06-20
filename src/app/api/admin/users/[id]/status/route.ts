/*
 * Archivo: src/app/api/admin/users/[id]/status/route.ts
 * Qué hace: Permite al administrador cambiar el estado de un usuario.
 * PATCH - actualiza el estado a ACTIVE, INACTIVE o BLOCKED.
 * Aprobación inicial (PENDING → ACTIVE): notificación + email.
 * Bloqueo: notificación + email.
 * Desactivación: solo notificación, sin email.
 * Reactivación (INACTIVE/BLOCKED → ACTIVE): notificación + email.
 * Solo accesible por el administrador.
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

    // Obtenemos el estado anterior antes de actualizar
    const previousUser = await prisma.user.findUnique({ where: { id } });
    const previousStatus = previousUser?.status;

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

    const isReactivation =
      status === "ACTIVE" &&
      (previousStatus === "INACTIVE" || previousStatus === "BLOCKED");
    const isInitialApproval = status === "ACTIVE" && previousStatus === "PENDING";

    // Notificación interna
    const messages: Record<string, string> = {
      ACTIVE: isReactivation
        ? "Tu cuenta fue reactivada. Ya podés volver a usar la plataforma."
        : "Tu cuenta fue aprobada. Ya podés usar la plataforma.",
      INACTIVE: "Tu cuenta fue desactivada.",
      BLOCKED: "Tu cuenta fue bloqueada. Contactá al administrador.",
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        message: messages[status],
      },
    });

    // Email — INACTIVE no envía email
    if (status === "ACTIVE") {
      if (isReactivation) {
        await sendMail({
          to: user.email,
          subject: "Tu cuenta fue reactivada — JobMatch Uruguay",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Tu cuenta fue reactivada</h2>
              <p>Hola ${firstName},</p>
              <p>Tu cuenta en JobMatch Uruguay fue reactivada. Ya podés volver a ingresar y usar la plataforma con normalidad.</p>
              <a href="${process.env.NEXTAUTH_URL}/login"
                style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
                Ingresar a JobMatch
              </a>
            </div>
          `,
        });
      } else if (isInitialApproval) {
        const emailData = emailUserApproved(firstName);
        await sendMail({ to: user.email, ...emailData });
      }
    } else if (status === "BLOCKED") {
      const emailData = emailUserBlocked(firstName, message);
      await sendMail({ to: user.email, ...emailData });
    }
    // INACTIVE: solo notificación, sin email

    return NextResponse.json({ message: "Estado actualizado", user });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}