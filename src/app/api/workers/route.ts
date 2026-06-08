/*
 * Archivo: src/app/api/workers/route.ts
 * Qué hace: Devuelve la lista de trabajadores disponibles en la plataforma.
 * Para usuarios no autenticados devuelve datos limitados sin información
 * sensible (sin teléfono, sin CV). Para empresas y admins devuelve
 * el perfil completo. Solo muestra trabajadores con estado ACTIVE.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const workers = await prisma.workerProfile.findMany({
      where: {
        user: { status: "ACTIVE" },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Si no está autenticado o es público, ocultar datos sensibles
    if (!token || (token.role !== "COMPANY" && token.role !== "ADMIN")) {
      const publicWorkers = workers.map((w) => ({
        id: w.id,
        firstName: w.firstName,
        department: w.department,
        availability: w.availability,
        description: w.description,
        categories: w.categories,
      }));
      return NextResponse.json(publicWorkers);
    }

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Error al obtener trabajadores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}