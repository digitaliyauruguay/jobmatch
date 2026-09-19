/*
 * Archivo: src/lib/agent-tools/consultar-postulaciones.ts
 * Qué hace: Envuelve consultar-postulaciones.handler.ts como AgentTool.
 * Es una tool única y estática (igual que buscar-ofertas.ts) — el aislamiento
 * entre empresas no lo da la tool, lo da el "context" con el companyId
 * que route.ts arma en cada request a partir de la sesión.
 */

import { defineTool } from "@/lib/agent-core";
import {
  consultarPostulacionesHandler,
  ConsultarPostulacionesInput,
} from "./consultar-postulaciones.handler";

export const consultarPostulacionesTool = defineTool<ConsultarPostulacionesInput, unknown>({
  name: "consultar_postulaciones",
  description:
    "Consulta las postulaciones que recibió la empresa logueada en sus ofertas de trabajo. Se puede filtrar por estado (pendiente, aprobada, rechazada) o por una oferta puntual. Usala siempre que te pregunten por postulantes, postulaciones o candidatos, en vez de responder de memoria.",
  inputSchema: {
    type: "object",
    properties: {
      estado: {
        type: "string",
        description: "'pendiente', 'aprobada' o 'rechazada'",
      },
      ofertaId: {
        type: "string",
        description: "Id de una oferta puntual, si el usuario pregunta por una en particular",
      },
    },
  },
  handler: consultarPostulacionesHandler,
});
