/*
 * Archivo: src/lib/agent-tools/resumen-ofertas.ts
 * Qué hace: Envuelve resumen-ofertas.handler.ts como AgentTool. Mismo
 * patrón que consultar-postulaciones.ts: tool estática, aislamiento por
 * context.companyId.
 */

import { defineTool } from "@/lib/agent-core";
import { resumenOfertasHandler, ResumenOfertasInput } from "./resumen-ofertas.handler";

export const resumenDeMisOfertasTool = defineTool<ResumenOfertasInput, unknown>({
  name: "resumen_de_mis_ofertas",
  description:
    "Muestra las ofertas de trabajo publicadas por la empresa logueada, con su estado y cuántas postulaciones tiene cada una. Usala cuando pregunten por sus propias ofertas, cuántas postulaciones tienen, o el estado de sus publicaciones.",
  inputSchema: {
    type: "object",
    properties: {
      soloActivas: {
        type: "boolean",
        description: "true para mostrar solo las ofertas activas (por default muestra todas)",
      },
    },
  },
  handler: resumenOfertasHandler,
});
