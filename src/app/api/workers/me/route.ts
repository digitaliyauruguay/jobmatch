/*
 * Archivo: src/app/api/workers/me/route.ts
 * Qué hace: Maneja el perfil del trabajador autenticado.
 * GET - devuelve el perfil completo del trabajador logueado.
 * POST - crea el perfil del trabajador por primera vez, justo
 * después del registro. Incluye nombre, foto, departamento,
 * teléfono, descripción, disponibilidad, CV y categorías.
 * PUT - actualiza los datos del perfil existente.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "WORKER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.workerProfile.findUnique({
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

    if (!token || token.role !== "WORKER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      photo,
      department,
      phone,
      description,
      availability,
      cvUrl,
      categoryIds,
    } = await req.json();

    if (!firstName || !lastName || !department || !phone || !availability || !categoryIds?.length) {
      return NextResponse.json(
        { error: "Nombre, apellido, departamento, teléfono, disponibilidad y al menos una categoría son requeridos" },
        { status: 400 }
      );
    }

    const existing = await prisma.workerProfile.findUnique({
      where: { userId: token.id as string },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya tenés un perfil creado" },
        { status: 409 }
      );
    }

    const profile = await prisma.workerProfile.create({
      data: {
        userId: token.id as string,
        firstName,
        lastName,
        photo: photo || null,
        department,
        phone,
        description: description || null,
        availability,
        cvUrl: cvUrl || null,
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

    if (!token || token.role !== "WORKER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      photo,
      department,
      phone,
      description,
      availability,
      cvUrl,
      categoryIds,
    } = await req.json();

    const existing = await prisma.workerProfile.findUnique({
      where: { userId: token.id as string },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No tenés un perfil creado" },
        { status: 404 }
      );
    }

    // Actualizar categorías — borrar las anteriores y crear las nuevas
    await prisma.workerCategory.deleteMany({
      where: { workerId: existing.id },
    });

    const profile = await prisma.workerProfile.update({
      where: { userId: token.id as string },
      data: {
        firstName,
        lastName,
        photo: photo || null,
        department,
        phone,
        description: description || null,
        availability,
        cvUrl: cvUrl || null,
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