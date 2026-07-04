/*
 * Archivo: src/app/api/auth/forgot-password/route.ts
 * Qué hace: Genera un código OTP de 6 dígitos para recuperar la
 * contraseña, lo guarda en el usuario con una expiración de 30
 * minutos, y lo envía por email. Por seguridad, siempre devuelve
 * la misma respuesta exista o no el email, para no revelar qué
 * cuentas están registradas.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { emailPasswordReset } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica para no revelar si el email existe o no
    const genericResponse = NextResponse.json({
      message: "Si el email existe, te enviamos un código para recuperar tu contraseña.",
    });

    if (!user) {
      return genericResponse;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode: code,
        resetCodeExpiry: expiry,
      },
    });

    const emailData = emailPasswordReset(code);
    await sendMail({ to: user.email, ...emailData });

    return genericResponse;
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}