/*
 * Archivo: src/app/api/jobs/route.ts
 * Qué hace: Maneja las ofertas de trabajo.
 * GET - lista las ofertas activas con filtros opcionales por categoría,
 * departamento, modalidad y fecha. El filtro de fecha usa UTC-3
 * (hora de Uruguay) para calcular correctamente "hoy", "última semana"
 * y "último mes" independientemente del timezone del servidor.
 * POST - crea una nueva oferta. Solo accesible por empresas activas.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Retorna el inicio del día de hoy en UTC-3 (hora uruguaya)
function startOfTodayUY(): Date {
  const now = new Date();
  // Convertir a UTC-3: restar 3 horas en ms
  const UY_OFFSET_MS = -3 * 60 * 60 * 1000;
  const nowInUY = new Date(now.getTime() + UY_OFFSET_MS);
  // Medianoche en hora uruguaya
  nowInUY.setUTCHours(0, 0, 0, 0);
  // Convertir de vuelta a UTC para comparar con la DB
  return new Date(nowInUY.getTime() - UY_OFFSET_MS);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const department = searchParams.get("department");
    const modality = searchParams.get("modality");
    const dateFilter = searchParams.get("date");

    let dateFrom: Date | undefined;
    if (dateFilter === "today") {
      dateFrom = startOfTodayUY();
    } else if (dateFilter === "week") {
      dateFrom = startOfTodayUY();
      dateFrom.setDate(dateFrom.getDate() - 7);
    } else if (dateFilter === "month") {
      dateFrom = startOfTodayUY();
      dateFrom.setMonth(dateFrom.getMonth() - 1);
    }

    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        ...(categoryId ? { categoryId } : {}),
        ...(department ? { department: department as any } : {}),
        ...(modality ? { modality: modality as any } : {}),
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
      },
      include: {
        category: { select: { name: true } },
        company: { select: { name: true, department: true } },
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

export async function POST(req: NextRequest) {
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

    const { title, description, department, modality, jobType, salary, categoryId } =
      await req.json();

    if (!title || !description || !department || !modality || !jobType || !categoryId) {
      return NextResponse.json(
        { error: "Completá todos los campos obligatorios" },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        department,
        modality,
        jobType,
        salary: salary || null,
        categoryId,
        companyId: company.id,
        status: "ACTIVE",
      },
      include: {
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error al crear oferta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}