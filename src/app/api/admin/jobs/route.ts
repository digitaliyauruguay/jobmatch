/*
 * Archivo: src/app/api/admin/jobs/route.ts
 * Qué hace: Devuelve la lista de todas las ofertas de trabajo
 * para el panel de administración, incluyendo la empresa que
 * las publicó. Permite filtrar por estado (ACTIVE, BLOCKED, DELETED).
 * Solo accesible por el administrador.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const jobs = await prisma.job.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
      },
      include: {
        company: {
          select: {
            name: true,
            department: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error al obtener ofertas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}