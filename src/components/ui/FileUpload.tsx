/*
 * Archivo: src/components/ui/FileUpload.tsx
 * Qué hace: Componente reutilizable para subir archivos a Cloudinary.
 * Acepta fotos de perfil, logos de empresas y CVs en PDF. Muestra una
 * vista previa de la imagen seleccionada, o un indicador con ícono y
 * "CV cargado" cuando ya existe un archivo guardado (currentUrl) o se
 * subió uno nuevo. Llama al endpoint /api/upload y devuelve la URL
 * del archivo subido via onUpload. Tema oscuro JobMatch.
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

  // Si currentUrl cambia (por ejemplo al cargar el perfil de forma asíncrona),
  // actualizamos la vista previa para reflejar el archivo ya guardado
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

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFileName(file.name);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
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
      setError("Error al subir el archivo. Intentá de nuevo.");
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
                ? "Subiendo..."
                : isImage
                ? "Subir foto (JPG, PNG — máx 2MB)"
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