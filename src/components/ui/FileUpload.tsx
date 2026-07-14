/*
 * Archivo: src/components/ui/FileUpload.tsx
 * Qué hace: Componente reutilizable para subir archivos a Cloudinary.
 * Acepta fotos de perfil, logos de empresas y CVs en PDF. Para imágenes,
 * comprime en el cliente antes de subir via Canvas API. Permite eliminar
 * el archivo actual (setea null en el padre via onRemove). Muestra
 * vista previa de imagen o indicador de CV cargado. Tema oscuro JobMatch.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { IconFileText, IconUpload, IconX } from "@tabler/icons-react";

type FileUploadProps = {
  type: "photo" | "logo" | "cv";
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentUrl?: string | null;
  label?: string;
};

const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;
const MAX_IMAGE_SIZE_MB = 10;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
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
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg", lastModified: Date.now(),
          }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Error al leer imagen")); };
    img.src = url;
  });
}

export default function FileUpload({ type, onUpload, onRemove, currentUrl, label }: FileUploadProps) {
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
    if (isImage) setPreview(currentUrl || null);
    else if (currentUrl) setFileName("CV cargado");
    else setFileName(null);
  }, [currentUrl, isImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      let fileToUpload = file;
      if (isImage) {
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          setError(`La imagen no puede superar los ${MAX_IMAGE_SIZE_MB}MB.`);
          setUploading(false);
          return;
        }
        fileToUpload = await compressImage(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFileName(file.name);
      }
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("type", type);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
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

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm text-jm-text-secondary">{label}</label>}

      <div className="relative">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-jm-border rounded-lg p-4 text-center cursor-pointer hover:border-jm-magenta transition-colors"
        >
          {isImage && preview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={preview} alt="Vista previa"
                className="w-20 h-20 rounded-full object-cover border border-jm-border" />
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
                {uploading ? "Procesando..." : isImage
                  ? "Subir foto (JPG, PNG — máx 10MB)"
                  : "Subir CV (PDF — máx 5MB)"}
              </p>
            </div>
          )}
        </div>

        {/* Botón eliminar — solo si hay archivo cargado y se pasó onRemove */}
        {onRemove && (preview || fileName) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            title="Eliminar"
            className="absolute top-2 right-2 p-1 bg-jm-red-bg border border-jm-red rounded-lg text-jm-red-light hover:bg-jm-red hover:text-white transition-colors cursor-pointer"
          >
            <IconX size={14} />
          </button>
        )}
      </div>

      {error && <p className="text-jm-red-light text-xs">{error}</p>}

      <input ref={inputRef} type="file" accept={accept}
        onChange={handleFileChange} className="hidden" />
    </div>
  );
}