/*
 * Archivo: src/app/api/workers/route.ts
 * Qué hace: Devuelve la lista de trabajadores disponibles en la plataforma,
 * con filtros opcionales por categoría, departamento, disponibilidad
 * y si tienen CV cargado. Para usuarios no autenticados devuelve datos
 * limitados sin información sensible (sin teléfono, sin CV).
 * Para empresas y admins devuelve el perfil completo.
 * Solo muestra trabajadores con estado ACTIVE.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const department = searchParams.get("department");
    const availability = searchParams.get("availability");
    const hasCV = searchParams.get("hasCV"); // "true" = solo con CV

    const workers = await prisma.workerProfile.findMany({
      where: {
        user: { status: "ACTIVE" },
        ...(department ? { department: department as any } : {}),
        ...(availability ? { availability: availability as any } : {}),
        ...(hasCV === "true" ? { cvUrl: { not: null } } : {}),
        ...(categoryId ? { categories: { some: { categoryId } } } : {}),
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
        // Indicar si tiene CV sin exponer la URL
        hasCV: !!w.cvUrl,
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