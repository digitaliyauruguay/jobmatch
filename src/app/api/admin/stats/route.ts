/*
 * Archivo: src/app/api/admin/stats/route.ts
 * Qué hace: Calcula las estadísticas de la plataforma para el panel
 * de administración. Acepta startDate/endDate opcionales (ISO date,
 * YYYY-MM-DD) — si no vienen, calcula sobre todo el historial.
 * Todas las métricas que dependen de fecha filtran por createdAt de
 * cada entidad (Job, User, Application, Observation), de forma
 * consistente. Las Application PENDING se muestran explícitamente
 * y no se excluyen del cálculo de tasa de aprobación: el denominador
 * incluye todo lo que entró en el período, resuelto o no.
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
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Rango de fechas — si no viene ninguno, es "todo el período" (sin filtro)
    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (startDateParam || endDateParam) {
      dateFilter = {};
      if (startDateParam) {
        dateFilter.gte = new Date(`${startDateParam}T00:00:00.000Z`);
      }
      if (endDateParam) {
        dateFilter.lte = new Date(`${endDateParam}T23:59:59.999Z`);
      }
    }

    const createdAtWhere = dateFilter ? { createdAt: dateFilter } : {};

    // --- Adopción: usuarios por rol y status ---
    const usersByRoleStatus = await prisma.user.groupBy({
      by: ["role", "status"],
      where: { role: { in: ["WORKER", "COMPANY"] }, ...createdAtWhere },
      _count: true,
    });

    // --- Adopción: ofertas por status ---
    const jobsByStatus = await prisma.job.groupBy({
      by: ["status"],
      where: createdAtWhere,
      _count: true,
    });

    // --- Efectividad: % trabajadores activos con >=1 application APPROVED ---
    const activeWorkersCount = await prisma.workerProfile.count({
      where: { user: { status: "ACTIVE" } },
    });
    const workersWithHireCount = await prisma.workerProfile.count({
      where: {
        user: { status: "ACTIVE" },
        applications: { some: { status: "APPROVED" } },
      },
    });

    // --- Efectividad: % empresas activas con >=1 job COMPLETED ---
    const activeCompaniesCount = await prisma.companyProfile.count({
      where: { user: { status: "ACTIVE" } },
    });
    const companiesWithHireCount = await prisma.companyProfile.count({
      where: {
        user: { status: "ACTIVE" },
        jobs: { some: { status: "COMPLETED" } },
      },
    });

    // --- Applications dentro del período, para tasa de aprobación y tiempos ---
    const applications = await prisma.application.findMany({
      where: createdAtWhere,
      select: {
        id: true,
        origin: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalApplications = applications.length;
    const pendingApplications = applications.filter((a) => a.status === "PENDING").length;
    const approvedApplications = applications.filter((a) => a.status === "APPROVED").length;
    const rejectedApplications = applications.filter((a) => a.status === "REJECTED").length;
    const resolvedApplications = approvedApplications + rejectedApplications;

    // Tasa de aprobación sobre lo resuelto (PENDING se muestra aparte, no se descarta)
    const approvalRate =
      resolvedApplications > 0 ? approvedApplications / resolvedApplications : null;

    // Misma tasa, separada por origen SELF vs INDICATED
    const computeByOrigin = (origin: "SELF" | "INDICATED") => {
      const subset = applications.filter((a) => a.origin === origin);
      const resolved = subset.filter((a) => a.status !== "PENDING").length;
      const approved = subset.filter((a) => a.status === "APPROVED").length;
      return {
        total: subset.length,
        pending: subset.filter((a) => a.status === "PENDING").length,
        approvalRate: resolved > 0 ? approved / resolved : null,
      };
    };

    const approvalRateByOrigin = {
      SELF: computeByOrigin("SELF"),
      INDICATED: computeByOrigin("INDICATED"),
    };

    // Tiempo promedio hasta contratación (solo APPROVED, createdAt -> updatedAt)
    const approvedWithTimes = applications.filter((a) => a.status === "APPROVED");
    const avgHireTimeMs =
      approvedWithTimes.length > 0
        ? approvedWithTimes.reduce(
            (sum, a) => sum + (new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime()),
            0
          ) / approvedWithTimes.length
        : null;
    const avgHireTimeDays = avgHireTimeMs !== null ? avgHireTimeMs / (1000 * 60 * 60 * 24) : null;

    // --- Demanda: categorías más solicitadas (por Job, dentro del período) ---
    const jobsByCategory = await prisma.job.groupBy({
      by: ["categoryId"],
      where: createdAtWhere,
      _count: true,
      orderBy: { _count: { categoryId: "desc" } },
    });
    const categoryIds = jobsByCategory.map((j) => j.categoryId);
    const categoriesData = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryNameMap = new Map(categoriesData.map((c) => [c.id, c.name]));
    const topCategories = jobsByCategory.map((j) => ({
      categoryId: j.categoryId,
      name: categoryNameMap.get(j.categoryId) || "Desconocida",
      count: j._count,
    }));

    // --- Demanda: departamentos con más ofertas ---
    const jobsByDepartment = await prisma.job.groupBy({
      by: ["department"],
      where: createdAtWhere,
      _count: true,
      orderBy: { _count: { department: "desc" } },
    });

    // --- Demanda: distribución por modalidad y tipo de trabajo ---
    const jobsByModality = await prisma.job.groupBy({
      by: ["modality"],
      where: createdAtWhere,
      _count: true,
    });
    const jobsByJobType = await prisma.job.groupBy({
      by: ["jobType"],
      where: createdAtWhere,
      _count: true,
    });

    // --- Moderación: observaciones en el período, por tipo de objetivo ---
    const observationsByTarget = await prisma.observation.groupBy({
      by: ["targetType"],
      where: createdAtWhere,
      _count: true,
    });

    return NextResponse.json({
      period: {
        startDate: startDateParam || null,
        endDate: endDateParam || null,
      },
      adoption: {
        usersByRoleStatus: usersByRoleStatus.map((u) => ({
          role: u.role,
          status: u.status,
          count: u._count,
        })),
        jobsByStatus: jobsByStatus.map((j) => ({
          status: j.status,
          count: j._count,
        })),
      },
      effectiveness: {
        workers: {
          active: activeWorkersCount,
          withAtLeastOneHire: workersWithHireCount,
          rate: activeWorkersCount > 0 ? workersWithHireCount / activeWorkersCount : null,
        },
        companies: {
          active: activeCompaniesCount,
          withAtLeastOneHire: companiesWithHireCount,
          rate: activeCompaniesCount > 0 ? companiesWithHireCount / activeCompaniesCount : null,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          approvalRate,
          byOrigin: approvalRateByOrigin,
        },
        avgHireTimeDays,
      },
      demand: {
        topCategories,
        jobsByDepartment: jobsByDepartment.map((j) => ({
          department: j.department,
          count: j._count,
        })),
        jobsByModality: jobsByModality.map((j) => ({
          modality: j.modality,
          count: j._count,
        })),
        jobsByJobType: jobsByJobType.map((j) => ({
          jobType: j.jobType,
          count: j._count,
        })),
      },
      moderation: {
        observationsByTarget: observationsByTarget.map((o) => ({
          targetType: o.targetType,
          count: o._count,
        })),
      },
    });
  } catch (error) {
    console.error("Error al calcular estadísticas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}