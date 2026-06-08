/*
 * Archivo: src/app/api/companies/me/route.ts
 * Qué hace: Maneja el perfil de la empresa autenticada.
 * GET - devuelve el perfil completo de la empresa logueada.
 * POST - crea el perfil de la empresa por primera vez, justo
 * después del registro. Incluye nombre, logo, departamento,
 * contacto, descripción y categorías del rubro.
 * PUT - actualiza los datos del perfil existente.
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

    const profile = await prisma.companyProfile.findUnique({
      where: { userId: token.id as string },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "COMPANY") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { name, logo, department, contact, description, categoryIds } =
      await req.json();

    if (!name || !department || !contact || !categoryIds?.length) {
      return NextResponse.json(
        { error: "Nombre, departamento, contacto y al menos una categoría son requeridos" },
        { status: 400 }
      );
    }

    const existing = await prisma.companyProfile.findUnique({
      where: { userId: token.id as string },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya tenés un perfil creado" },
        { status: 409 }
      );
    }

    const profile = await prisma.companyProfile.create({
      data: {
        userId: token.id as string,
        name,
        logo: logo || null,
        department,
        contact,
        description: description || null,
        categories: {
          create: categoryIds.map((id: string) => ({ categoryId: id })),
        },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error al crear perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "COMPANY") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { name, logo, department, contact, description, categoryIds } =
      await req.json();

    const existing = await prisma.companyProfile.findUnique({
      where: { userId: token.id as string },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No tenés un perfil creado" },
        { status: 404 }
      );
    }

    // Actualizar categorías — borrar las anteriores y crear las nuevas
    await prisma.companyCategory.deleteMany({
      where: { companyId: existing.id },
    });

    const profile = await prisma.companyProfile.update({
      where: { userId: token.id as string },
      data: {
        name,
        logo: logo || null,
        department,
        contact,
        description: description || null,
        categories: {
          create: categoryIds.map((id: string) => ({ categoryId: id })),
        },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}