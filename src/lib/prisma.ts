/*
 * Archivo: src/lib/prisma.ts
 * Qué hace: Crea y exporta una única instancia del cliente de Prisma
 * para ser reutilizada en toda la aplicación. Evita crear múltiples
 * conexiones a la base de datos, lo cual es especialmente importante
 * en desarrollo con Next.js donde el servidor se reinicia seguido.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}