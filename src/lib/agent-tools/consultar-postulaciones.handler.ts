/*
 * Archivo: src/lib/agent-tools/consultar-postulaciones.handler.ts
 * Qué hace: Consulta las postulaciones recibidas en las ofertas de UNA
 * empresa puntual. El companyId nunca lo elige el modelo de IA ni el
 * usuario: llega en el "context" que arma route.ts a partir de la sesión
 * ya verificada (mismo mecanismo de ToolContext que ya trae agent-core).
 * Así ninguna empresa puede ver postulaciones de otra, ni aunque se lo
 * pida raro al chat.
 */

import { prisma } from "../prisma";
import { ApplicationStatus } from "@prisma/client";
import { ToolContext } from "../agent-core";

export interface ConsultarPostulacionesInput {
  estado?: string;
  ofertaId?: string;
}

function comoEstado(valor?: string): ApplicationStatus | undefined {
  if (!valor) return undefined;
  const normal = valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
  const alias: Record<string, ApplicationStatus> = {
    PENDIENTE: "PENDING",
    PENDING: "PENDING",
    APROBADA: "APPROVED",
    APROBADO: "APPROVED",
    APPROVED: "APPROVED",
    RECHAZADA: "REJECTED",
    RECHAZADO: "REJECTED",
    REJECTED: "REJECTED",
  };
  return alias[normal];
}

function estadoLegible(estado: ApplicationStatus): string {
  const legible: Record<ApplicationStatus, string> = {
    PENDING: "pendiente",
    APPROVED: "aprobada",
    REJECTED: "rechazada",
  };
  return legible[estado];
}

export async function consultarPostulacionesHandler(
  input: ConsultarPostulacionesInput,
  context: ToolContext
) {
  const companyId = context.companyId as string | undefined;
  if (!companyId) {
    return { error: "No se pudo identificar la empresa de la sesión." };
  }

  const estado = comoEstado(input.estado);
  if (input.estado && !estado) {
    return { error: `No reconozco el estado "${input.estado}". Usá pendiente, aprobada o rechazada.` };
  }

  const postulaciones = await prisma.application.findMany({
    where: {
      job: {
        companyId,
        ...(input.ofertaId ? { id: input.ofertaId } : {}),
      },
      ...(estado ? { status: estado } : {}),
    },
    include: {
      job: { select: { id: true, title: true } },
      worker: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (postulaciones.length === 0) {
    return { resultados: [], mensaje: "No hay postulaciones con esos filtros." };
  }

  return {
    resultados: postulaciones.map((p) => ({
      trabajador: `${p.worker.firstName} ${p.worker.lastName}`,
      oferta: p.job.title,
      estado: estadoLegible(p.status),
      postulada: p.createdAt.toISOString(),
      enlace: `/company/dashboard?jobId=${p.job.id}`,
    })),
  };
}
