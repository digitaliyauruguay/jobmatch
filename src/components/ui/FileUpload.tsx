/*
 * Archivo: src/components/ui/FileUpload.tsx
 * Qué hace: Componente reutilizable para subir archivos a Cloudinary.
 * Acepta fotos de perfil, logos de empresas y CVs en PDF.
 * Muestra una vista previa de la imagen seleccionada y el nombre
 * del archivo en caso de PDF. Llama al endpoint /api/upload y
 * devuelve la URL del archivo subido via onUpload.
 */

"use client";

import { useState, useRef } from "react";

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
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = type === "photo" || type === "logo";
  const accept = isImage ? "image/*" : "application/pdf";

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
      {label && <label className="text-sm text-gray-700">{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        {isImage && preview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={preview}
              alt="Vista previa"
              className="w-20 h-20 rounded-full object-cover"
            />
            <p className="text-xs text-gray-500">Clic para cambiar</p>
          </div>
        ) : !isImage && fileName ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xs text-gray-700 font-medium">{fileName}</p>
            <p className="text-xs text-gray-500">Clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <p className="text-sm text-gray-500">
              {uploading
                ? "Subiendo..."
                : isImage
                ? "Subir foto (JPG, PNG — máx 2MB)"
                : "Subir CV (PDF — máx 5MB)"}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

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