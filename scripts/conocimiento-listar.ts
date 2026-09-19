/*
 * Archivo: scripts/conocimiento-listar.ts
 * Qué hace: Lista todas las entradas de la base de conocimiento del agente
 * (activas e inactivas), para revisar qué sabe hoy o encontrar el id de
 * algo que querés borrar/desactivar.
 *
 * Uso (PowerShell):
 *   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
 *   npx ts-node scripts/conocimiento-listar.ts
 *
 * Para desactivar una entrada sin borrarla (deja de aparecer en las
 * respuestas del agente, pero queda guardada):
 *   npx ts-node scripts/conocimiento-desactivar.ts <id>
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const entradas = await prisma.agentKnowledge.findMany({
    orderBy: { updatedAt: "desc" },
  });

  if (entradas.length === 0) {
    console.log("Todavía no hay ninguna entrada en la base de conocimiento.");
    return;
  }

  for (const e of entradas) {
    console.log(`\n[${e.activo ? "activo" : "inactivo"}] ${e.tema}  (id: ${e.id})`);
    console.log(e.contenido);
  }
}

main()
  .catch((err) => {
    console.error("Error listando conocimiento:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
