/*
 * Archivo: src/app/api/upload/route.ts
 * Qué hace: Endpoint para subir archivos a Cloudinary.
 * Acepta imágenes (fotos de perfil, logos) y documentos (CVs en PDF).
 * Organiza los archivos en carpetas según el tipo.
 * Solo accesible por usuarios autenticados.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    if (!["photo", "logo", "cv"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de archivo inválido" },
        { status: 400 }
      );
    }

    // Validaciones por tipo
    if (type === "cv") {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "El CV debe ser un archivo PDF" },
          { status: 400 }
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "El CV no puede superar los 5MB" },
          { status: 400 }
        );
      }
    }

    if (type === "photo" || type === "logo") {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "El archivo debe ser una imagen" },
          { status: 400 }
        );
      }
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "La imagen no puede superar los 2MB" },
          { status: 400 }
        );
      }
    }

    // Convertir archivo a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Subir a Cloudinary
    const folder = type === "cv" ? "cvs" : type === "logo" ? "logos" : "photos";
    const resourceType = type === "cv" ? "raw" : "image";
    const url = await uploadFile(base64, folder, resourceType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
}