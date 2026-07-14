/*
 * Archivo: src/app/api/admin/users/route.ts
 * Qué hace: Maneja la gestión de usuarios desde el panel de administración.
 * GET - devuelve la lista de todos los usuarios con sus perfiles,
 * permitiendo filtrar por estado (PENDING, ACTIVE, INACTIVE, BLOCKED).
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

    const users = await prisma.user.findMany({
      where: {
        role: { in: ["WORKER", "COMPANY"] },
        ...(status ? { status: status as any } : {}),
      },
      include: {
        workerProfile: {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    department: true,
  },
},
companyProfile: {
  select: {
    id: true,
    name: true,
    department: true,
  },
},
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}