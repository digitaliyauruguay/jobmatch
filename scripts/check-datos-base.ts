/*
 * Archivo: scripts/check-datos-base.ts
 * Qué hace: Diagnóstico rápido de qué hay cargado en la base (usuarios,
 * categorías, empresas), para saber qué necesitamos antes de crear una
 * oferta de trabajo de prueba.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [usuarios, categorias, empresas] = await Promise.all([
    prisma.user.count(),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.companyProfile.findMany({ select: { id: true, name: true, userId: true } }),
  ]);

  console.log("Usuarios totales:", usuarios);
  console.log("\nCategorías:", JSON.stringify(categorias, null, 2));
  console.log("\nEmpresas:", JSON.stringify(empresas, null, 2));
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
