/*
 * Archivo: src/lib/agent-tools/consultar-conocimiento.ts
 * Qué hace: Envuelve consultar-conocimiento.handler.ts como una AgentTool
 * lista para usar con GroqAgent/Agent/GeminiAgent de agent-core. Mismo
 * patrón que buscar-ofertas.ts: la lógica real vive en el .handler.ts.
 */

import { defineTool } from "@/lib/agent-core";
import {
  consultarConocimientoHandler,
  ConsultarConocimientoInput,
} from "./consultar-conocimiento.handler";

export const consultarBaseDeConocimientoTool = defineTool<ConsultarConocimientoInput, unknown>({
  name: "consultar_base_de_conocimiento",
  description:
    "Busca información propia de JobMatch Uruguay (reglas de la plataforma, respuestas a preguntas frecuentes, aclaraciones) que no viene de la base de ofertas de trabajo. Usala cuando te pregunten algo sobre cómo funciona JobMatch, políticas, o cualquier duda que no sea directamente buscar un trabajo.",
  inputSchema: {
    type: "object",
    properties: {
      consulta: {
        type: "string",
        description: "El tema o pregunta del usuario, en pocas palabras (ej: 'cómo postularme', 'cómo edito mi perfil')",
      },
    },
    required: ["consulta"],
  },
  handler: consultarConocimientoHandler,
});
