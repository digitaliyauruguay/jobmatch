/*
 * Archivo: src/app/api/categories/route.ts
 * Qué hace: Devuelve la lista de todas las categorías disponibles
 * en la plataforma. Es un endpoint público, cualquiera puede consultarlo
 * sin estar logueado. Se usa en los formularios de registro, creación
 * de ofertas y filtros de búsqueda.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}