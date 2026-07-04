/*
 * Archivo: src/app/api/companies/[id]/route.ts
 * Qué hace: Devuelve el perfil completo de una empresa específica.
 * Para usuarios autenticados devuelve todos los datos incluyendo
 * contacto. Para usuarios no autenticados devuelve datos limitados.
 * Solo muestra empresas con estado ACTIVE, salvo que quien consulta
 * sea ADMIN, que puede ver el perfil en cualquier estado
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

    const company = await prisma.companyProfile.findUnique({
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

    if (!company || (!isAdmin && company.user.status !== "ACTIVE")) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Datos limitados para usuarios no autenticados
    if (!token) {
      return NextResponse.json({
        id: company.id,
        name: company.name,
        department: company.department,
        description: company.description,
        logo: company.logo,
        categories: company.categories,
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error al obtener empresa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}