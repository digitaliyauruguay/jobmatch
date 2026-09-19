/*
 * Archivo: scripts/conocimiento-desactivar.ts
 * Qué hace: Desactiva (activo: false) una entrada de la base de
 * conocimiento por id, sin borrarla. Una entrada desactivada deja de
 * aparecer en las respuestas del agente pero queda guardada por si la
 * querés reactivar más adelante.
 *
 * Uso (PowerShell):
 *   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
 *   npx ts-node scripts/conocimiento-desactivar.ts <id>
 *
 * El id lo sacás de scripts/conocimiento-listar.ts.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [id] = process.argv.slice(2);

  if (!id) {
    console.error("Uso: npx ts-node scripts/conocimiento-desactivar.ts <id>");
    process.exitCode = 1;
    return;
  }

  const actualizado = await prisma.agentKnowledge.update({
    where: { id },
    data: { activo: false },
  });
  console.log("Entrada desactivada:", JSON.stringify(actualizado, null, 2));
}

main()
  .catch((err) => {
    console.error("Error desactivando la entrada (¿el id es correcto?):", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
