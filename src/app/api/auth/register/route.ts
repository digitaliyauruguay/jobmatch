/*
 * Archivo: src/app/api/auth/register/route.ts
 * Qué hace: Maneja el registro completo de nuevos usuarios en un solo paso.
 * Crea el usuario y su perfil (trabajador o empresa) en la misma operación.
 * El usuario queda en estado PENDING hasta que el admin lo apruebe.
 * No requiere autenticación previa.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, profile } = await req.json();

    if (!email || !password || !role || !profile) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    if (role !== "WORKER" && role !== "COMPANY") {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario y perfil en una sola operación
    if (role === "WORKER") {
      const { firstName, lastName, department, phone, description, availability, photo, cvUrl, categoryIds } = profile;

      if (!firstName || !lastName || !department || !phone || !availability || !categoryIds?.length) {
        return NextResponse.json(
          { error: "Completá todos los campos obligatorios del perfil" },
          { status: 400 }
        );
      }

      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "WORKER",
          status: "PENDING",
          workerProfile: {
            create: {
              firstName,
              lastName,
              department,
              phone,
              description: description || null,
              availability,
              photo: photo || null,
              cvUrl: cvUrl || null,
              categories: {
                create: categoryIds.map((id: string) => ({ categoryId: id })),
              },
            },
          },
        },
      });
    }

    if (role === "COMPANY") {
      const { name, department, contact, description, logo, categoryIds } = profile;

      if (!name || !department || !contact || !categoryIds?.length) {
        return NextResponse.json(
          { error: "Completá todos los campos obligatorios del perfil" },
          { status: 400 }
        );
      }

      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "COMPANY",
          status: "PENDING",
          companyProfile: {
            create: {
              name,
              department,
              contact,
              description: description || null,
              logo: logo || null,
              categories: {
                create: categoryIds.map((id: string) => ({ categoryId: id })),
              },
            },
          },
        },
      });
    }

    return NextResponse.json(
      { message: "Cuenta creada exitosamente. Esperá la aprobación del administrador." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}