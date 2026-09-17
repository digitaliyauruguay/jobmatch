/*
 * Archivo: scripts/test-buscar-ofertas.ts
 * Qué hace: Prueba la tool buscarOfertasHandler directo contra tu base de
 * Supabase, SIN pasar por ningún modelo de IA ni por el resto de la app.
 * Sirve para confirmar que la consulta a Prisma funciona antes de conectarla
 * a un agente.
 *
 * Uso (PowerShell):
 *   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
 *   npx ts-node scripts/test-buscar-ofertas.ts
 */
import "dotenv/config";
import { buscarOfertasHandler } from "../src/lib/agent-tools/buscar-ofertas.handler";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Diagnóstico: cuántos Job hay en total, por status ===");
  const total = await prisma.job.count();
  const porStatus = await prisma.job.groupBy({ by: ["status"], _count: true });
  console.log(`Total de ofertas en la tabla: ${total}`);
  console.log(JSON.stringify(porStatus, null, 2));

  console.log("\n=== Prueba 1: sin filtros (últimas 5 ofertas activas) ===");
  console.log(JSON.stringify(await buscarOfertasHandler({}), null, 2));

  console.log("\n=== Prueba 2: por departamento (Montevideo) ===");
  console.log(
    JSON.stringify(await buscarOfertasHandler({ departamento: "Montevideo" }), null, 2)
  );

  console.log("\n=== Prueba 3: por modalidad (remoto) ===");
  console.log(JSON.stringify(await buscarOfertasHandler({ modalidad: "remoto" }), null, 2));

  console.log("\n=== Prueba 4: palabra clave inventada (no debería haber resultados) ===");
  console.log(
    JSON.stringify(
      await buscarOfertasHandler({ palabraClave: "xyzzzz-no-deberia-existir" }),
      null,
      2
    )
  );

  console.log("\n=== Prueba 5: departamento inválido (debería devolver error, no explotar) ===");
  console.log(
    JSON.stringify(await buscarOfertasHandler({ departamento: "Narnia" }), null, 2)
  );
}

main()
  .catch((err) => {
    console.error("Error corriendo la prueba:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
