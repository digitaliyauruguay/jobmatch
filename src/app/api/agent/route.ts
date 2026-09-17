/*
 * Archivo: src/app/api/agent/route.ts
 * Qué hace: Endpoint del asistente virtual de JobMatch. Recibe un mensaje
 * del usuario (y el historial de la conversación), lo pasa por GroqAgent
 * con la tool de búsqueda de ofertas, y devuelve la respuesta.
 *
 * Requiere sesión activa de un trabajador (mismo patrón que el resto de
 * las rutas de API de la app) — así el botón del chat, que solo se ve en
 * el dashboard de trabajador, coincide con lo que el servidor realmente
 * permite, y no queda abierto a que cualquiera gaste tu cuota de Groq.
 *
 * Es de solo lectura (la tool solo hace SELECT), así que no hay riesgo
 * de que el agente modifique datos aunque falle algo en el chequeo.
 *
 * Para producción real conviene sumar también un rate limit por usuario
 * (mismo patrón que ya tenés en middleware.ts para /api/auth/*).
 *
 * Variable de entorno necesaria: GROQ_API_KEY (agregala a tu .env).
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GroqAgent, GroqMessage } from "@/lib/agent-core";
import { buscarOfertasDeTrabajoTool } from "@/lib/agent-tools/buscar-ofertas";

export const runtime = "nodejs";

const agent = new GroqAgent({
  systemPrompt: `Sos el asistente virtual de JobMatch Uruguay, una plataforma que conecta
trabajadores con empresas en Uruguay, pensada especialmente para gente que busca su primer
empleo o trabajos de entrada.

Hablás como una persona real charlando por chat, no como un robot ni como un reporte
generado automáticamente. Escribí en oraciones y párrafos cortos, en español rioplatense,
tono cercano y natural — como le explicarías esto a alguien en persona. Muchos usuarios
tienen poca experiencia usando este tipo de plataformas, así que sé simple y directo.

Reglas de formato MUY importantes (este chat NO renderiza markdown, así que cualquier
símbolo de formato se ve roto y raro):
- NUNCA uses tablas (nada de "|" ni líneas separadoras).
- NUNCA uses asteriscos para negrita ni títulos con "#".
- NUNCA uses listas con guiones o números. Si tenés que mencionar varias opciones,
  encadenalas en una oración natural ("tenés una de mozo en Ciudad Vieja y otra de
  limpieza en el centro").
- Mencioná cada oferta como lo haría una persona: el puesto, la empresa, dónde es y la
  modalidad, en una frase fluida — no como una ficha técnica con todos los campos.

Cuando te pregunten por trabajos disponibles, usá SIEMPRE la herramienta de búsqueda en vez
de responder de memoria o inventar ofertas. Si no hay resultados, decilo con honestidad, en
tono relajado (no "no se encontraron resultados" sino algo como "no encontré nada de eso
por ahora"), y sugerí una alternativa concreta de forma conversacional.

Cada oferta que te devuelve la herramienta trae un campo "enlace" (una ruta interna, como
"/worker/dashboard?jobId=..."). Incluí ese enlace tal cual viene después de mencionar esa
oferta, como quien pasa un link en una conversación ("mirala acá: /worker/dashboard?..."),
nunca lo omitas ni lo inventes si la herramienta no lo trajo.

No inventes datos de contacto, salarios ni empresas que no vengan de la herramienta.`,
  tools: [buscarOfertasDeTrabajoTool],
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "WORKER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const userMessage: string = body.message;
    const history: GroqMessage[] = body.history ?? [];

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json({ error: "Falta 'message' en el body" }, { status: 400 });
    }

    const result = await agent.run({ userMessage, history });

    return NextResponse.json({
      reply: result.reply,
      history: result.history,
    });
  } catch (err: any) {
    console.error("Error en /api/agent:", err);
    return NextResponse.json({ error: "Error interno del agente" }, { status: 500 });
  }
}
