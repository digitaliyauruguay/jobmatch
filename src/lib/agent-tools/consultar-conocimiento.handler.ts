/*
 * Archivo: src/lib/agent-tools/consultar-conocimiento.handler.ts
 * Qué hace: Busca en la tabla AgentKnowledge (la base de conocimiento
 * editable) entradas relacionadas con lo que preguntó el usuario.
 *
 * Historial de esta lógica (para no repetir los mismos bugs):
 * 1) Primera versión comparaba si el tema/contenido GUARDADO contenía la
 *    pregunta COMPLETA del usuario como substring literal. Casi nunca
 *    matcheaba.
 * 2) Segunda versión comparó por palabras sueltas, pero de forma literal
 *    ("postulo" vs "postularme" no comparten substring exacto por la
 *    conjugación en español).
 * 3) Esta versión compara por RAÍZ de palabra (los primeros ~5 caracteres),
 *    que es un stemming casero pero cubre la mayoría de las conjugaciones
 *    normales del español ("postulo"/"postulaste"/"postularme" comparten
 *    la raíz "postu").
 */

import { prisma } from "../prisma";

export interface ConsultarConocimientoInput {
  consulta: string;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes
    .toLowerCase()
    .trim();
}

// Raíz simple de una palabra: los primeros ~5 caracteres. No es un
// stemmer real, pero alcanza para agrupar conjugaciones de un mismo verbo
// o variantes de un mismo sustantivo sin depender de una librería externa.
function raiz(palabra: string): string {
  return palabra.length > 5 ? palabra.slice(0, 5) : palabra;
}

// Palabras sueltas que no aportan nada a la búsqueda (si no se filtran,
// cualquier pregunta "matchea" con cualquier entrada).
const PALABRAS_VACIAS = new Set([
  "que", "como", "cual", "cuales", "para", "por", "con", "los", "las",
  "una", "uno", "del", "puedo", "quiero", "hay", "esta", "estan", "tengo",
  "tiene", "sobre", "donde", "cuando", "quien", "esto", "eso",
]);

export async function consultarConocimientoHandler(input: ConsultarConocimientoInput) {
  const consulta = (input.consulta ?? "").trim();

  if (!consulta) {
    return { resultados: [], mensaje: "Falta la consulta." };
  }

  const entradas = await prisma.agentKnowledge.findMany({
    where: { activo: true },
    orderBy: { updatedAt: "desc" },
  });

  if (entradas.length === 0) {
    return { resultados: [], mensaje: "Todavía no hay ninguna entrada cargada en la base de conocimiento." };
  }

  const consultaNorm = normalizar(consulta);
  const palabrasConsulta = consultaNorm
    .split(/\W+/)
    .filter((p) => p.length >= 3 && !PALABRAS_VACIAS.has(p));

  const puntuadas = entradas
    .map((e) => {
      const temaNorm = normalizar(e.tema);
      const contenidoNorm = normalizar(e.contenido);
      let score = 0;

      // Coincidencia de frase completa en cualquier sentido -> señal fuerte
      if (consultaNorm.includes(temaNorm) || temaNorm.includes(consultaNorm)) {
        score += 5;
      }

      for (const palabra of palabrasConsulta) {
        const r = raiz(palabra);
        if (temaNorm.includes(palabra)) score += 3;
        else if (temaNorm.includes(r)) score += 2;

        if (contenidoNorm.includes(palabra)) score += 2;
        else if (contenidoNorm.includes(r)) score += 1;
      }

      return { entrada: e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (puntuadas.length === 0) {
    return { resultados: [], mensaje: "No hay información propia de JobMatch sobre este tema." };
  }

  return {
    resultados: puntuadas.map(({ entrada }) => ({ tema: entrada.tema, contenido: entrada.contenido })),
  };
}
