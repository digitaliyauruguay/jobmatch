/*
 * Archivo: src/lib/agent-core/agent-groq.ts
 * Qué hace: Motor genérico del agente hablando con Groq (gratis, sin
 * tarjeta). No sabe nada de JobMatch en particular — la personalidad
 * (systemPrompt) y las capacidades (tools) se le inyectan desde afuera,
 * en app/api/agent/route.ts. Copiado del paquete agent-core reutilizable.
 */
import Groq from "groq-sdk";
import { AgentConfig, AgentTool, ToolContext } from "./types";

const DEFAULT_MODEL = "openai/gpt-oss-120b"; // gratis en Groq, con buen soporte de tool-calling
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_MAX_TOOL_ROUNDS = 5;

export type GroqMessage = Groq.Chat.ChatCompletionMessageParam;

export interface RunGroqAgentParams {
  history?: GroqMessage[];
  userMessage: string;
  context?: ToolContext;
}

export interface RunGroqAgentResult {
  reply: string;
  history: GroqMessage[];
  toolCalls: { name: string; input: unknown; output: unknown }[];
}

export class GroqAgent {
  private client: Groq;
  private model: string;
  private systemPrompt: string;
  private tools: AgentTool[];
  private toolsByName: Map<string, AgentTool>;
  private maxTokens: number;
  private maxToolRounds: number;

  constructor(config: AgentConfig) {
    const apiKey = config.apiKey ?? process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Falta la API key de Groq. Pasala en AgentConfig.apiKey o seteá GROQ_API_KEY (conseguila gratis en https://console.groq.com/keys)."
      );
    }
    this.client = new Groq({ apiKey });
    this.model = config.model ?? DEFAULT_MODEL;
    this.systemPrompt = config.systemPrompt;
    this.tools = config.tools ?? [];
    this.toolsByName = new Map(this.tools.map((t) => [t.name, t]));
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.maxToolRounds = config.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;
  }

  private toolDefinitions(): Groq.Chat.ChatCompletionTool[] {
    return this.tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema as Record<string, unknown>,
      },
    }));
  }

  async run(params: RunGroqAgentParams): Promise<RunGroqAgentResult> {
    const context: ToolContext = params.context ?? {};
    const messages: GroqMessage[] = [
      { role: "system", content: this.systemPrompt },
      ...(params.history ?? []),
      { role: "user", content: params.userMessage },
    ];

    const toolCalls: RunGroqAgentResult["toolCalls"] = [];
    let round = 0;

    while (true) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        tools: this.tools.length > 0 ? this.toolDefinitions() : undefined,
        tool_choice: this.tools.length > 0 ? "auto" : undefined,
      });

      const assistantMessage = response.choices[0].message;
      const calls = assistantMessage.tool_calls ?? [];

      if (calls.length === 0 || round >= this.maxToolRounds) {
        messages.push(assistantMessage);
        return {
          reply: assistantMessage.content ?? "",
          history: messages.slice(1),
          toolCalls,
        };
      }

      messages.push(assistantMessage);

      for (const call of calls) {
        const tool = this.toolsByName.get(call.function.name);
        let outputText: string;

        if (!tool) {
          outputText = JSON.stringify({ error: `No existe una tool llamada "${call.function.name}".` });
        } else {
          try {
            const args = JSON.parse(call.function.arguments || "{}");
            const output = await tool.handler(args, context);
            outputText = typeof output === "string" ? output : JSON.stringify(output);
            toolCalls.push({ name: tool.name, input: args, output });
          } catch (err: any) {
            outputText = JSON.stringify({
              error: `Error ejecutando la tool "${tool.name}": ${err?.message ?? err}`,
            });
          }
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: outputText,
        });
      }

      round += 1;
    }
  }
}
