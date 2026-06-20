/*
 * Archivo: src/app/api/jobs/[id]/route.ts
 * Qué hace: Maneja operaciones sobre una oferta específica.
 * GET - devuelve el detalle completo de una oferta, accesible públicamente.
 * PUT - actualiza una oferta existente, solo la empresa dueña puede hacerlo.
 * Notifica a los postulados en estado PENDING sobre la modificación.
 * DELETE - elimina lógicamente una oferta cambiando su estado a DELETED,
 * solo la empresa dueña o el admin pueden hacerlo. Notifica a los
 * postulados en estado PENDING sobre la eliminación.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        company: {
          select: {
            name: true,
            department: true,
            description: true,
            logo: true,
          },
        },
      },
    });

    if (!job || job.status === "DELETED") {
      return NextResponse.json(
        { error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error al obtener oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { title, description, department, modality, jobType, salary, categoryId } =
      await req.json();

    const updated = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        department,
        modality,
        jobType,
        salary: salary || null,
        categoryId,
      },
    });

    // Notificar a postulados pendientes sobre la modificación
    const pendingApplications = await prisma.application.findMany({
      where: { jobId: id, status: "PENDING" },
      include: { worker: true },
    });

    for (const app of pendingApplications) {
      await prisma.notification.create({
        data: {
          userId: app.worker.userId,
          message: `La oferta "${updated.title}" a la que estás postulado fue modificada. Revisá los nuevos detalles.`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: { include: { user: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "La oferta no existe" },
        { status: 404 }
      );
    }

    // Verificar que sea la empresa dueña o el admin
    if (token.role === "COMPANY") {
      const company = await prisma.companyProfile.findUnique({
        where: { userId: token.id as string },
      });
      if (!company || job.companyId !== company.id) {
        return NextResponse.json(
          { error: "No tenés permiso para eliminar esta oferta" },
          { status: 403 }
        );
      }
    } else if (token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.job.update({
      where: { id },
      data: { status: "DELETED" },
    });

    // Notificar a postulados pendientes sobre la eliminación (solo notificación, sin email)
    const pendingApplications = await prisma.application.findMany({
      where: { jobId: id, status: "PENDING" },
      include: { worker: true },
    });

    for (const app of pendingApplications) {
      await prisma.notification.create({
        data: {
          userId: app.worker.userId,
          message: `La oferta "${job.title}" a la que estabas postulado fue eliminada por la empresa.`,
        },
      });
    }

    return NextResponse.json({ message: "Oferta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}