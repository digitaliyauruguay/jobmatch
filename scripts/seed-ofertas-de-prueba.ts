/*
 * Archivo: scripts/seed-ofertas-de-prueba.ts
 * Qué hace: Crea una empresa de prueba (usuario COMPANY + CompanyProfile,
 * ya ACTIVE, sin pasar por el flujo de aprobación) y 3 ofertas de trabajo
 * variadas en departamento/modalidad/categoría, para poder probar
 * buscarOfertasHandler con datos reales.
 *
 * Usa upsert donde se puede, así que es seguro correrlo más de una vez:
 * no va a duplicar la empresa (por email único), aunque si lo corrés de
 * nuevo SÍ va a crear ofertas nuevas cada vez (Job no tiene una clave
 * única natural para hacer upsert). Si querés limpiar las de prueba
 * después, quedan identificables por el email de la empresa.
 *
 * Uso:
 *   npx ts-node scripts/seed-ofertas-de-prueba.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const EMPRESA_TEST_EMAIL = "empresa-prueba@jobmatch.com";

async function main() {
  const password = await bcrypt.hash("prueba1234", 10);

  const userEmpresa = await prisma.user.upsert({
    where: { email: EMPRESA_TEST_EMAIL },
    update: {},
    create: {
      email: EMPRESA_TEST_EMAIL,
      password,
      role: "COMPANY",
      status: "ACTIVE", // salteamos el flujo PENDING para poder probar ya
    },
  });
  console.log("Usuario empresa:", userEmpresa.email);

  const empresa = await prisma.companyProfile.upsert({
    where: { userId: userEmpresa.id },
    update: {},
    create: {
      userId: userEmpresa.id,
      name: "Empresa de Prueba SA",
      department: "MONTEVIDEO",
      contact: "099123456",
      description: "Empresa creada por script para probar el agente de IA.",
    },
  });
  console.log("Empresa:", empresa.name);

  const categoriaGastronomia = await prisma.category.findUnique({
    where: { name: "Gastronomía y hotelería" },
  });
  const categoriaTech = await prisma.category.findUnique({
    where: { name: "Tecnología e IT" },
  });
  const categoriaLimpieza = await prisma.category.findUnique({
    where: { name: "Limpieza y mantenimiento" },
  });

  if (!categoriaGastronomia || !categoriaTech || !categoriaLimpieza) {
    throw new Error(
      "Faltan categorías base — corré primero: npx prisma db seed"
    );
  }

  const ofertas = [
    {
      title: "Mozo/a para restaurante en Ciudad Vieja",
      description: "Buscamos mozo/a con experiencia para turno de mediodía, de lunes a viernes.",
      department: "MONTEVIDEO" as const,
      modality: "PRESENTIAL" as const,
      jobType: "PART_TIME" as const,
      salary: "UYU 25000",
      categoryId: categoriaGastronomia.id,
    },
    {
      title: "Desarrollador/a junior remoto",
      description: "Buscamos perfil junior con conocimientos de JavaScript para sumarse a equipo remoto.",
      department: "CANELONES" as const,
      modality: "REMOTE" as const,
      jobType: "FULL_TIME" as const,
      salary: "UYU 45000",
      categoryId: categoriaTech.id,
    },
    {
      title: "Personal de limpieza para oficinas",
      description: "Limpieza de oficinas en horario matutino, de lunes a sábado.",
      department: "MONTEVIDEO" as const,
      modality: "PRESENTIAL" as const,
      jobType: "PART_TIME" as const,
      salary: null,
      categoryId: categoriaLimpieza.id,
    },
  ];

  for (const oferta of ofertas) {
    const creada = await prisma.job.create({
      data: { ...oferta, companyId: empresa.id, status: "ACTIVE" },
    });
    console.log("Oferta creada:", creada.title);
  }

  console.log("\nListo. Corré ahora: npx ts-node scripts/test-buscar-ofertas.ts");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
