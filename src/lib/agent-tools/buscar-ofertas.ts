/*
 * Archivo: src/lib/agent-tools/buscar-ofertas.ts
 * Qué hace: Envuelve buscar-ofertas.handler.ts como una AgentTool lista
 * para usar con GroqAgent/Agent/GeminiAgent de agent-core. La lógica real
 * de la consulta vive en el .handler.ts (separada a propósito, para poder
 * probarla sin necesidad de tener agent-core instalado todavía).
 */

import { defineTool } from "@/lib/agent-core";
import { buscarOfertasHandler, BuscarOfertasInput } from "./buscar-ofertas.handler";

export const buscarOfertasDeTrabajoTool = defineTool<BuscarOfertasInput, unknown>({
  name: "buscar_ofertas_de_trabajo",
  description:
    "Busca ofertas de trabajo activas en JobMatch Uruguay, con filtros opcionales por palabra clave (busca en título y descripción), categoría, departamento (ej: Montevideo, Canelones) y modalidad (presencial, remoto, híbrido). Usala siempre que el usuario pregunte por trabajos disponibles, en vez de responder de memoria.",
  inputSchema: {
    type: "object",
    properties: {
      palabraClave: {
        type: "string",
        description: "Texto libre para buscar en el título o la descripción de la oferta",
      },
      categoria: {
        type: "string",
        description: "Nombre de la categoría (ej: 'Gastronomía', 'Limpieza', 'Ventas')",
      },
      departamento: {
        type: "string",
        description:
          "Departamento de Uruguay en lenguaje natural (ej: 'Montevideo', 'Río Negro')",
      },
      modalidad: {
        type: "string",
        description: "'presencial', 'remoto' o 'híbrido'",
      },
      limite: {
        type: "number",
        description: "Máximo de resultados a devolver (default 5)",
      },
    },
  },
  handler: buscarOfertasHandler,
});
