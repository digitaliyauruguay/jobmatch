/*
 * Archivo: src/app/api/admin/observations/route.ts
 * Qué hace: Maneja las observaciones del administrador sobre perfiles
 * y ofertas.
 * GET - devuelve todas las observaciones registradas.
 * POST - crea una observación sobre un usuario o una oferta,
 * bloquea el elemento observado y notifica al afectado por
 * notificación interna y email.
 * Solo accesible por el administrador.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const observations = await prisma.observation.findMany({
      include: {
        targetUser: {
          select: {
            email: true,
            role: true,
            workerProfile: {
              select: { firstName: true, lastName: true },
            },
            companyProfile: {
              select: { name: true },
            },
          },
        },
        targetJob: {
          select: {
            title: true,
            company: {
              select: { name: true },
            },
          },
        },
        admin: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(observations);
  } catch (error) {
    console.error("Error al obtener observaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { message, targetType, targetUserId, targetJobId } = await req.json();

    if (!message || !targetType) {
      return NextResponse.json(
        { error: "Mensaje y tipo de objetivo son requeridos" },
        { status: 400 }
      );
    }

    if (targetType === "USER" && !targetUserId) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    if (targetType === "JOB" && !targetJobId) {
      return NextResponse.json(
        { error: "ID de oferta requerido" },
        { status: 400 }
      );
    }

    // Crear observación
    const observation = await prisma.observation.create({
      data: {
        message,
        targetType,
        targetUserId: targetUserId || null,
        targetJobId: targetJobId || null,
        adminId: token.id as string,
      },
    });

    // Bloquear y notificar según el tipo
    if (targetType === "USER" && targetUserId) {
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: { status: "BLOCKED" },
        include: {
          workerProfile: true,
          companyProfile: true,
        },
      });

      const firstName =
        user.workerProfile?.firstName ||
        user.companyProfile?.name ||
        "Usuario";

      await prisma.notification.create({
        data: {
          userId: user.id,
          message: `Tu cuenta fue bloqueada. Motivo: ${message}`,
        },
      });

      await sendMail({
        to: user.email,
        subject: "Tu cuenta fue bloqueada — JobMatch Uruguay",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Tu cuenta fue bloqueada</h2>
            <p>Hola ${firstName},</p>
            <p>Tu cuenta en JobMatch Uruguay fue bloqueada por el administrador.</p>
            <p><strong>Motivo:</strong> ${message}</p>
            <p>Si creés que esto es un error, respondé este email para contactar al equipo.</p>
          </div>
        `,
      });
    }

    if (targetType === "JOB" && targetJobId) {
      const job = await prisma.job.update({
        where: { id: targetJobId },
        data: { status: "BLOCKED" },
        include: {
          company: {
            include: { user: true },
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: job.company.user.id,
          message: `Tu oferta "${job.title}" fue bloqueada. Motivo: ${message}`,
        },
      });

      await sendMail({
        to: job.company.user.email,
        subject: `Tu oferta fue bloqueada — JobMatch Uruguay`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Tu oferta fue bloqueada</h2>
            <p>Hola ${job.company.name},</p>
            <p>Tu oferta <strong>"${job.title}"</strong> fue bloqueada por el administrador.</p>
            <p><strong>Motivo:</strong> ${message}</p>
            <p>Revisá el contenido y contactá al equipo si tenés dudas.</p>
          </div>
        `,
      });
    }

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    console.error("Error al crear observación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}