/*
 * Archivo: src/lib/agent-core/types.ts
 * Qué hace: Tipos centrales del agente (copiados del paquete agent-core
 * genérico). Define el "contrato" que las tools usan para darle nuevas
 * capacidades al agente sin tocar el motor.
 */

export interface AgentTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (input: TInput, context: ToolContext) => Promise<TOutput> | TOutput;
}

/**
 * Contexto que se le pasa a cada tool cuando se ejecuta. Poné acá cualquier
 * dato específico de la request (usuario logueado, etc.) al invocar al
 * agente, así las tools pueden usarlo.
 */
export interface ToolContext {
  userId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AgentConfig {
  /** API key de Groq. Por defecto lee process.env.GROQ_API_KEY */
  apiKey?: string;
  /** Modelo a usar. Default: openai/gpt-oss-120b */
  model?: string;
  /** Instrucciones de sistema: define la personalidad/objetivo del agente */
  systemPrompt: string;
  /** Herramientas disponibles para este agente */
  tools?: AgentTool[];
  /** Máximo de tokens de la respuesta */
  maxTokens?: number;
  /** Máximo de "vueltas" de tool-use antes de forzar una respuesta final */
  maxToolRounds?: number;
}
