/*
 * Archivo: prisma/seed.ts
 * Qué hace: Pobla la base de datos con datos iniciales necesarios
 * para que la aplicación funcione. Crea el usuario administrador
 * y las categorías de rubros. Se ejecuta una sola vez con el
 * comando npx prisma db seed.
 * No te va a crear otro ni modificar el actual. Fijate que usamos upsert en lugar de create.
 * upsert funciona así: busca si ya existe un registro con ese email, si existe lo deja exactamente igual (el update: {} vacío significa "no cambies nada"), y si no existe lo crea. Es una operación segura que podés correr todas las veces que quieras sin miedo.
 * Lo mismo pasa con las categorías, si ya existieran las dejaría igual y solo crearía las que falten.
 * Así que podés correr el seed tranquilo:
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear administrador
  const password = await bcrypt.hash("admin1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@jobmatch.com" },
    update: {},
    create: {
      email: "admin@jobmatch.com",
      password,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Admin creado:", admin.email);

  // Crear categorías
  const categories = [
    "Tecnología e IT",
    "Gastronomía y hotelería",
    "Comercio y ventas",
    "Administración y oficina",
    "Construcción y oficios",
    "Salud y cuidados",
    "Educación y formación",
    "Logística y transporte",
    "Agricultura y campo",
    "Limpieza y mantenimiento",
    "Seguridad",
    "Arte, diseño y comunicación",
    "Otros",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Categorías creadas:", categories.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });