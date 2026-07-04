/*
 * Archivo: src/app/api/workers/[id]/route.ts
 * Qué hace: Devuelve el perfil completo de un trabajador específico.
 * Para empresas y admins devuelve todos los datos incluyendo teléfono
 * y CV. Para usuarios no autenticados devuelve datos limitados.
 * Solo muestra trabajadores con estado ACTIVE, salvo que quien
 * consulta sea ADMIN, que puede ver el perfil en cualquier estado
 * (PENDING/INACTIVE/BLOCKED) para revisión y moderación.
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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin = token?.role === "ADMIN";

    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
        user: {
          select: { status: true },
        },
      },
    });

    if (!worker || (!isAdmin && worker.user.status !== "ACTIVE")) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Datos limitados para usuarios no autenticados
    if (!token || (token.role !== "COMPANY" && token.role !== "ADMIN")) {
      return NextResponse.json({
        id: worker.id,
        firstName: worker.firstName,
        department: worker.department,
        availability: worker.availability,
        description: worker.description,
        photo: worker.photo,
        categories: worker.categories,
      });
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Error al obtener trabajador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}