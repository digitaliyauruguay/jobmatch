import { AgentTool } from "../types";

/** Helper para definir una tool con tipado (autocompletado al escribirlas). */
export function defineTool<TInput = any, TOutput = any>(
  tool: AgentTool<TInput, TOutput>
): AgentTool<TInput, TOutput> {
  return tool;
}
