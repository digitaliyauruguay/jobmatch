/*
 * Archivo: src/app/api/agent/route.ts
 * Qué hace: Endpoint único del asistente virtual de JobMatch, para
 * trabajadores Y empresas. Valida sesión, elige el agente que corresponde
 * según el rol, y le pasa el mensaje.
 *
 * Los dos agentes (trabajador y empresa) son instancias únicas y
 * perezosas, igual que antes — el aislamiento entre empresas NO se logra
 * creando un agente por request, sino pasando el companyId de la empresa
 * logueada como "context" en cada llamada a .run(). El modelo de IA nunca
 * ve ni elige ese companyId: lo resuelve este archivo, del lado del
 * servidor, a partir del token ya verificado. Las tools de empresa
 * (consultar-postulaciones, resumen-ofertas) lo leen de context.companyId.
 *
 * Variable de entorno necesaria: GROQ_API_KEY (agregala a tu .env).
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GroqAgent, GroqMessage } from "@/lib/agent-core";
import { buscarOfertasDeTrabajoTool } from "@/lib/agent-tools/buscar-ofertas";
import { consultarBaseDeConocimientoTool } from "@/lib/agent-tools/consultar-conocimiento";
import { consultarPostulacionesTool } from "@/lib/agent-tools/consultar-postulaciones";
import { resumenDeMisOfertasTool } from "@/lib/agent-tools/resumen-ofertas";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PROMPT_BASE = `Hablás como una persona real charlando por chat, no como un robot ni como un
reporte generado automáticamente. Escribí en oraciones y párrafos cortos, en español
rioplatense, tono cercano y natural.

Reglas de formato MUY importantes (este chat SÍ respeta los saltos de línea que escribas,
pero NO renderiza símbolos de markdown como **, # o |, así que esos se ven rotos y raros):
- NUNCA uses tablas (nada de "|" ni líneas separadoras).
- NUNCA uses asteriscos para negrita ni títulos con "#". Esto incluye resaltar nombres de
  botones, opciones o palabras puntuales (nada de **así** ni *así*) — escribilos en texto
  plano, sin ningún símbolo alrededor, como lo harías en un mensaje de WhatsApp.
- Separá ideas distintas en párrafos cortos, con una línea en blanco entre ellos, en vez de
  escribir todo pegado en un solo bloque denso.
- Cuando menciones varios elementos (varias ofertas, varias postulaciones, varios pasos),
  no los amontones en una sola oración larga: poné cada uno en su propia línea, con un
  guion simple "-" adelante, y una línea en blanco antes de empezar la lista. Nunca uses
  numeración con puntos (1. 2. 3.).

Cada elemento que te devuelve una herramienta puede traer un campo "enlace" (una ruta
interna). Incluí ese enlace tal cual viene después de mencionar ese elemento, como quien
pasa un link en una conversación, nunca lo omitas ni lo inventes si la herramienta no lo
trajo.

Regla estricta, sin excepciones: TODO lo que digas tiene que salir de lo que te devolvió
una herramienta en ESTA conversación. Nunca completes con supuestos "de sentido común"
sobre cómo funciona JobMatch (pasos para postularse, qué botones existen, qué pasa
después, etc.) aunque te parezcan obvios o razonables — si no vinieron de una herramienta,
son inventados. Si ninguna herramienta trajo la información que te piden, decilo con
honestidad en una frase corta y natural (por ejemplo "no tengo ese dato a mano ahora
mismo") en vez de armar una respuesta con pasos o detalles que no confirmaste.`;

// ---------- Agente para trabajadores ----------

let workerAgent: GroqAgent | null = null;

function getWorkerAgent(): GroqAgent {
  if (workerAgent) return workerAgent;

  workerAgent = new GroqAgent({
    systemPrompt: `Sos el asistente virtual de JobMatch Uruguay, una plataforma que conecta
trabajadores con empresas en Uruguay, pensada especialmente para gente que busca su primer
empleo o trabajos de entrada. Muchos usuarios tienen poca experiencia usando este tipo de
plataformas, así que sé simple y directo.

${PROMPT_BASE}

Cuando te pregunten por trabajos disponibles, usá SIEMPRE la herramienta de búsqueda en vez
de responder de memoria o inventar ofertas. Si no hay resultados, decilo con honestidad, en
tono relajado (no "no se encontraron resultados" sino algo como "no encontré nada de eso
por ahora"), y sugerí una alternativa concreta de forma conversacional.

Además de buscar ofertas, tenés una herramienta para consultar información propia de
JobMatch (cómo funciona la plataforma, preguntas frecuentes, aclaraciones). Usala SIEMPRE
que pregunten algo que no sea directamente buscar un trabajo — incluido cómo postularse,
cómo editar el perfil, o cualquier "cómo hago para...". Nunca respondas esas preguntas de
memoria: consultá la herramienta primero, aunque la respuesta te parezca obvia. Si tampoco
ahí encontrás nada, decilo con honestidad en vez de inventar una respuesta.`,
    tools: [buscarOfertasDeTrabajoTool, consultarBaseDeConocimientoTool],
  });

  return workerAgent;
}

// ---------- Agente para empresas ----------

let companyAgent: GroqAgent | null = null;

function getCompanyAgent(): GroqAgent {
  if (companyAgent) return companyAgent;

  companyAgent = new GroqAgent({
    systemPrompt: `Sos el asistente virtual de JobMatch Uruguay para empresas. Ayudás a la
empresa logueada a hacer seguimiento de sus ofertas de trabajo publicadas y de las
postulaciones que recibió.

${PROMPT_BASE}

Cuando te pregunten por postulaciones, postulantes o candidatos, usá SIEMPRE la herramienta
de consultar postulaciones. Cuando te pregunten por sus propias ofertas, cuántas tienen, o
el estado de sus publicaciones, usá la herramienta de resumen de ofertas. Si no hay
resultados, decilo con honestidad en vez de inventar datos.

Además tenés una herramienta para consultar información propia de JobMatch (cómo funciona
la plataforma, preguntas frecuentes). Usala SIEMPRE para cualquier pregunta que no sea
sobre sus propias ofertas o postulaciones — nunca respondas esas preguntas de memoria.`,
    tools: [consultarPostulacionesTool, resumenDeMisOfertasTool, consultarBaseDeConocimientoTool],
  });

  return companyAgent;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || (token.role !== "WORKER" && token.role !== "COMPANY")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const userMessage: string = body.message;
    const history: GroqMessage[] = body.history ?? [];

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json({ error: "Falta 'message' en el body" }, { status: 400 });
    }

    let result;

    if (token.role === "WORKER") {
      result = await getWorkerAgent().run({ userMessage, history });
    } else {
      const userId = token.id as string;
      const company = await prisma.companyProfile.findUnique({ where: { userId } });

      if (!company) {
        return NextResponse.json({ error: "No se encontró un perfil de empresa" }, { status: 404 });
      }

      result = await getCompanyAgent().run({
        userMessage,
        history,
        context: { companyId: company.id },
      });
    }

    return NextResponse.json({
      reply: result.reply,
      history: result.history,
    });
  } catch (err: any) {
    console.error("Error en /api/agent:", err);
    return NextResponse.json({ error: "Error interno del agente" }, { status: 500 });
  }
}
