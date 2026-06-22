/*
 * Archivo: src/app/api/companies/me/jobs/route.ts
 * Qué hace: Devuelve todas las ofertas publicadas por la empresa
 * autenticada, incluyendo categoría, fecha de completado (completedAt)
 * y observaciones del admin (con el motivo y quién la hizo, para
 * mostrar detalle en ofertas bloqueadas). Se usa en el dashboard
 * de la empresa para mostrar el listado de ofertas propias.
 * Solo accesible por empresas.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
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

    const jobs = await prisma.job.findMany({
      where: {
        companyId: company.id,
      },
      include: {
        category: { select: { name: true } },
        observations: {
          orderBy: { createdAt: "desc" },
          include: {
            admin: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error al obtener ofertas de la empresa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}