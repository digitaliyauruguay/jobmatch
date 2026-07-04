/*
 * Archivo: src/components/ui/FileUpload.tsx
 * Qué hace: Componente reutilizable para subir archivos a Cloudinary.
 * Acepta fotos de perfil, logos de empresas y CVs en PDF. Para imágenes,
 * comprime en el cliente antes de subir: redimensiona a máx 1200px y
 * convierte a JPEG calidad 85% usando Canvas API — sin dependencias extra.
 * Esto permite aceptar imágenes grandes (hasta 10MB) y siempre entregar
 * un archivo liviano (<300KB aprox) a Cloudinary. Muestra vista previa
 * de imagen o indicador de CV cargado. Tema oscuro JobMatch.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { IconFileText, IconUpload } from "@tabler/icons-react";

type FileUploadProps = {
  type: "photo" | "logo" | "cv";
  onUpload: (url: string) => void;
  currentUrl?: string | null;
  label?: string;
};

const MAX_IMAGE_DIMENSION = 1200; // px — redimensiona si supera este valor
const JPEG_QUALITY = 0.85;        // 85% calidad JPEG
const MAX_IMAGE_SIZE_MB = 10;     // límite de entrada antes de comprimir

// Comprime una imagen usando Canvas API del navegador.
// Redimensiona proporcionalmente si supera MAX_IMAGE_DIMENSION,
// y convierte a JPEG con JPEG_QUALITY. Devuelve un File comprimido.
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Redimensionar proporcionalmente si supera el máximo
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas no disponible")); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Error al comprimir")); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Error al leer imagen")); };
    img.src = url;
  });
}

export default function FileUpload({
  type,
  onUpload,
  currentUrl,
  label,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string | null>(
    !["photo", "logo"].includes(type) && currentUrl ? "CV cargado" : null
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = type === "photo" || type === "logo";
  const accept = isImage ? "image/*" : "application/pdf";

  useEffect(() => {
    if (isImage) {
      setPreview(currentUrl || null);
    } else if (currentUrl) {
      setFileName("CV cargado");
    }
  }, [currentUrl, isImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      let fileToUpload = file;

      if (isImage) {
        // Validar tamaño antes de intentar comprimir
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          setError(`La imagen no puede superar los ${MAX_IMAGE_SIZE_MB}MB.`);
          setUploading(false);
          return;
        }

        // Comprimir en el cliente antes de subir
        fileToUpload = await compressImage(file);

        // Mostrar preview con la imagen original (más rápido que esperar la comprimida)
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFileName(file.name);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setPreview(null);
        setFileName(null);
        return;
      }

      onUpload(data.url);
    } catch {
      setError("Error al procesar el archivo. Intentá de nuevo.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm text-jm-text-secondary">{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-jm-border rounded-lg p-4 text-center cursor-pointer hover:border-jm-magenta transition-colors"
      >
        {isImage && preview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={preview}
              alt="Vista previa"
              className="w-20 h-20 rounded-full object-cover border border-jm-border"
            />
            <p className="text-xs text-jm-text-tertiary">Clic para cambiar</p>
          </div>
        ) : !isImage && fileName ? (
          <div className="flex flex-col items-center gap-2">
            <IconFileText size={28} className="text-jm-cyan-light" />
            <p className="text-xs text-jm-text font-medium">{fileName}</p>
            <p className="text-xs text-jm-text-tertiary">Clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <IconUpload size={28} className="text-jm-text-tertiary" />
            <p className="text-sm text-jm-text-tertiary">
              {uploading
                ? "Procesando..."
                : isImage
                ? "Subir foto (JPG, PNG — máx 10MB)"
                : "Subir CV (PDF — máx 5MB)"}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-jm-red-light text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}