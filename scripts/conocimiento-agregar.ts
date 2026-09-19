/*
 * Archivo: scripts/conocimiento-agregar.ts
 * Qué hace: Agrega (o actualiza, si ya existe ese tema) una entrada a la
 * base de conocimiento del agente de IA (tabla AgentKnowledge). Es la forma
 * de "enseñarle" cosas nuevas al asistente sin tocar código ni redeployar:
 * el agente la consulta en tiempo real la próxima vez que alguien pregunte
 * algo relacionado.
 *
 * Uso (PowerShell):
 *   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
 *   npx ts-node scripts/conocimiento-agregar.ts "tema" "contenido de la respuesta"
 *
 * Ejemplo:
 *   npx ts-node scripts/conocimiento-agregar.ts "como postularme" "Para postularte a una oferta, entrá al detalle desde el dashboard y tocá el botón Postularme. No hace falta subir CV para todas las ofertas, depende de la empresa."
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [tema, contenido] = process.argv.slice(2);

  if (!tema || !contenido) {
    console.error(
      'Uso: npx ts-node scripts/conocimiento-agregar.ts "tema" "contenido"'
    );
    process.exitCode = 1;
    return;
  }

  const existente = await prisma.agentKnowledge.findFirst({
    where: { tema: { equals: tema, mode: "insensitive" } },
  });

  if (existente) {
    const actualizado = await prisma.agentKnowledge.update({
      where: { id: existente.id },
      data: { contenido, activo: true },
    });
    console.log("Entrada actualizada:", JSON.stringify(actualizado, null, 2));
    return;
  }

  const creado = await prisma.agentKnowledge.create({
    data: { tema, contenido },
  });
  console.log("Entrada creada:", JSON.stringify(creado, null, 2));
}

main()
  .catch((err) => {
    console.error("Error agregando conocimiento:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
