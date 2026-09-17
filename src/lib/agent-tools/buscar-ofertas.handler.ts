/*
 * Archivo: src/lib/agent-tools/buscar-ofertas.handler.ts
 * Qué hace: La lógica real de búsqueda de ofertas (consulta a Prisma),
 * separada del "envoltorio" de tool para el agente. Se separa así a
 * propósito: este archivo no depende de agent-core, así que se puede
 * importar y probar solo (por ejemplo con scripts/test-buscar-ofertas.ts)
 * sin necesidad de tener el agente todavía instalado en el proyecto.
 */

import { prisma } from "../prisma"; // ruta relativa a propósito: "@/" no lo resuelve ts-node al correr scripts sueltos
import { Department, Modality } from "@prisma/client";

export interface BuscarOfertasInput {
  palabraClave?: string;
  categoria?: string;
  departamento?: string;
  modalidad?: string;
  limite?: number;
}

// Normaliza texto tipo "Rio Negro" / "río negro" -> "RIO_NEGRO", para poder
// aceptar lo que el usuario/modelo escriba en lenguaje natural y matchear
// el valor real del enum de Prisma.
function normalizarEnum(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function comoDepartamento(valor?: string): Department | undefined {
  if (!valor) return undefined;
  const normalizado = normalizarEnum(valor);
  return (Object.values(Department) as string[]).includes(normalizado)
    ? (normalizado as Department)
    : undefined;
}

export function comoModalidad(valor?: string): Modality | undefined {
  if (!valor) return undefined;
  const normalizado = normalizarEnum(valor);
  const alias: Record<string, Modality> = {
    PRESENCIAL: "PRESENTIAL",
    REMOTO: "REMOTE",
    HIBRIDO: "HYBRID",
    PRESENTIAL: "PRESENTIAL",
    REMOTE: "REMOTE",
    HYBRID: "HYBRID",
  };
  return alias[normalizado];
}

export async function buscarOfertasHandler(input: BuscarOfertasInput) {
  const departamento = comoDepartamento(input.departamento);
  const modalidad = comoModalidad(input.modalidad);

  if (input.departamento && !departamento) {
    return { error: `No reconozco el departamento "${input.departamento}".` };
  }
  if (input.modalidad && !modalidad) {
    return { error: `No reconozco la modalidad "${input.modalidad}". Usá presencial, remoto o híbrido.` };
  }

  const ofertas = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      ...(departamento ? { department: departamento } : {}),
      ...(modalidad ? { modality: modalidad } : {}),
      ...(input.categoria
        ? { category: { name: { contains: input.categoria, mode: "insensitive" } } }
        : {}),
      ...(input.palabraClave
        ? {
            OR: [
              { title: { contains: input.palabraClave, mode: "insensitive" } },
              { description: { contains: input.palabraClave, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      category: { select: { name: true } },
      company: { select: { name: true, department: true } },
    },
    orderBy: { createdAt: "desc" },
    take: input.limite ?? 5,
  });

  if (ofertas.length === 0) {
    return { resultados: [], mensaje: "No se encontraron ofertas con esos filtros." };
  }

  return {
    resultados: ofertas.map((o) => ({
      id: o.id,
      titulo: o.title,
      empresa: o.company.name,
      categoria: o.category.name,
      departamento: o.department,
      modalidad: o.modality,
      tipoDeEmpleo: o.jobType,
      salario: o.salary,
      publicada: o.createdAt.toISOString(),
      // Link directo a la oferta resaltada en el dashboard del trabajador.
      enlace: `/worker/dashboard?jobId=${o.id}`,
    })),
  };
}
