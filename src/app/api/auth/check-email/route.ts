/*
 * Archivo: src/app/api/auth/check-email/route.ts
 * Qué hace: Verifica si un email ya está registrado en la base de datos.
 * Se usa en el formulario de registro para validar el email antes
 * de avanzar al siguiente paso, evitando que el usuario complete
 * todo el perfil y recién ahí se entere de que el email está en uso.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    console.error("Error al verificar email:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}