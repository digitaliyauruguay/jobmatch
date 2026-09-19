/*
 * Archivo: scripts/seed-postulaciones-de-prueba.ts
 * Qué hace: Crea (o reusa) la empresa de prueba, le asegura al menos una
 * oferta activa, crea 2 trabajadores de prueba, y los postula a esa
 * oferta con estados distintos (pendiente, aprobada, rechazada) para
 * poder probar el agente de IA del lado de empresas con datos reales.
 *
 * Es seguro correrlo más de una vez: usa upsert en todo lo que tiene una
 * clave única natural (usuarios por email, postulaciones por [jobId,
 * workerId]). Lo único que NO hace upsert es la oferta -- si la empresa
 * ya tiene alguna, la reusa; si no tiene ninguna, crea una nueva.
 *
 * Uso (PowerShell):
 *   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
 *   npx ts-node scripts/seed-postulaciones-de-prueba.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const EMPRESA_TEST_EMAIL = "empresa-prueba@jobmatch.com";

async function main() {
  // 1. Empresa de prueba (la misma que crea seed-ofertas-de-prueba.ts)
  const passwordEmpresa = await bcrypt.hash("prueba1234", 10);

  const userEmpresa = await prisma.user.upsert({
    where: { email: EMPRESA_TEST_EMAIL },
    update: {},
    create: {
      email: EMPRESA_TEST_EMAIL,
      password: passwordEmpresa,
      role: "COMPANY",
      status: "ACTIVE",
    },
  });

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
  console.log("Empresa:", empresa.name, `(${userEmpresa.email})`);

  // 2. Asegurar que tenga al menos una oferta activa
  let oferta = await prisma.job.findFirst({
    where: { companyId: empresa.id, status: "ACTIVE" },
  });

  if (!oferta) {
    const categoria = await prisma.category.findFirst();
    if (!categoria) {
      throw new Error("No hay categorías cargadas — corré primero: npx prisma db seed");
    }

    oferta = await prisma.job.create({
      data: {
        title: "Mozo/a para restaurante en Ciudad Vieja",
        description: "Buscamos mozo/a con experiencia para turno de mediodía, de lunes a viernes.",
        department: "MONTEVIDEO",
        modality: "PRESENTIAL",
        jobType: "PART_TIME",
        salary: "UYU 25000",
        categoryId: categoria.id,
        companyId: empresa.id,
        status: "ACTIVE",
      },
    });
    console.log("Oferta creada (la empresa no tenía ninguna activa):", oferta.title);
  } else {
    console.log("Reusando oferta activa existente:", oferta.title);
  }

  // 3. Trabajadores de prueba
  const passwordWorker = await bcrypt.hash("prueba1234", 10);

  const trabajadores = [
    { email: "trabajador-prueba-1@jobmatch.com", firstName: "Lucía", lastName: "Fernández", estado: "PENDING" as const },
    { email: "trabajador-prueba-2@jobmatch.com", firstName: "Martín", lastName: "Silva", estado: "APPROVED" as const },
    { email: "trabajador-prueba-3@jobmatch.com", firstName: "Ana", lastName: "Rodríguez", estado: "REJECTED" as const },
  ];

  for (const t of trabajadores) {
    const userWorker = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        password: passwordWorker,
        role: "WORKER",
        status: "ACTIVE",
      },
    });

    const worker = await prisma.workerProfile.upsert({
      where: { userId: userWorker.id },
      update: {},
      create: {
        userId: userWorker.id,
        firstName: t.firstName,
        lastName: t.lastName,
        department: "MONTEVIDEO",
        phone: "099000000",
        availability: "IMMEDIATE",
      },
    });

    const postulacion = await prisma.application.upsert({
      where: { jobId_workerId: { jobId: oferta.id, workerId: worker.id } },
      update: { status: t.estado },
      create: {
        jobId: oferta.id,
        workerId: worker.id,
        origin: "SELF",
        status: t.estado,
      },
    });
    console.log(`Postulación (${t.estado}):`, `${t.firstName} ${t.lastName} -> ${oferta.title}`);
  }

  console.log("\nListo. Ya podés preguntarle al agente (logueado como empresa-prueba@jobmatch.com / prueba1234).");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
