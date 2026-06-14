/*
 * Archivo: src/lib/cloudinary.ts
 * Qué hace: Configura y exporta el cliente de Cloudinary para subir
 * archivos desde el servidor. Se usa para subir fotos de perfil,
 * logos de empresas y CVs de trabajadores. Los archivos se organizan
 * en carpetas separadas según el tipo dentro de Cloudinary.
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadFile(
  file: string,
  folder: string,
  resourceType: "image" | "raw" = "image"
) {
  const result = await cloudinary.uploader.upload(file, {
    folder: `jobmatch/${folder}`,
    resource_type: resourceType,
  });
  return result.secure_url;
}