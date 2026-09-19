/*
 * Archivo: src/lib/agent-tools/resumen-ofertas.handler.ts
 * Qué hace: Devuelve las ofertas publicadas por la empresa logueada
 * (identificada por context.companyId, nunca por algo que venga del
 * modelo o del usuario) junto con cuántas postulaciones tiene cada una.
 */

import { prisma } from "../prisma";
import { JobStatus } from "@prisma/client";
import { ToolContext } from "../agent-core";

export interface ResumenOfertasInput {
  soloActivas?: boolean;
}

function estadoLegible(estado: JobStatus): string {
  const legible: Record<JobStatus, string> = {
    ACTIVE: "activa",
    BLOCKED: "bloqueada",
    DELETED: "eliminada",
    COMPLETED: "completada",
  };
  return legible[estado];
}

export async function resumenOfertasHandler(input: ResumenOfertasInput, context: ToolContext) {
  const companyId = context.companyId as string | undefined;
  if (!companyId) {
    return { error: "No se pudo identificar la empresa de la sesión." };
  }

  const ofertas = await prisma.job.findMany({
    where: {
      companyId,
      ...(input.soloActivas ? { status: "ACTIVE" } : {}),
    },
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  if (ofertas.length === 0) {
    return { resultados: [], mensaje: "Esta empresa todavía no publicó ninguna oferta." };
  }

  return {
    resultados: ofertas.map((o) => ({
      titulo: o.title,
      estado: estadoLegible(o.status),
      postulaciones: o._count.applications,
      publicada: o.createdAt.toISOString(),
      enlace: `/company/dashboard?jobId=${o.id}`,
    })),
  };
}
