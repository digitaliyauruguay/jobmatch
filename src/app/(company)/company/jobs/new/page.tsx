/*
 * Archivo: src/app/(company)/company/jobs/new/page.tsx
 * Qué hace: Página para que la empresa cree una nueva oferta de trabajo.
 * Validación campo por campo en orden con mensajes descriptivos,
 * asteriscos en campos obligatorios, y feedback de procesando/éxito
 * en el botón de submit. Mensajes con ícono y auto-dismiss de 4 segundos.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconX, IconCheck, IconLoader2 } from "@tabler/icons-react";

type Category = { id: string; name: string };
type Message = { type: "error" | "success"; text: string } | null;

const DEPARTMENTS = [
  "MONTEVIDEO","CANELONES","MALDONADO","ROCHA","TREINTA_Y_TRES",
  "CERRO_LARGO","RIVERA","ARTIGAS","SALTO","PAYSANDU","RIO_NEGRO",
  "SORIANO","COLONIA","SAN_JOSE","FLORES","FLORIDA","DURAZNO",
  "TACUAREMBO","LAVALLEJA",
];

const DEPARTMENT_LABELS: Record<string,string> = {
  MONTEVIDEO:"Montevideo",CANELONES:"Canelones",MALDONADO:"Maldonado",
  ROCHA:"Rocha",TREINTA_Y_TRES:"Treinta y Tres",CERRO_LARGO:"Cerro Largo",
  RIVERA:"Rivera",ARTIGAS:"Artigas",SALTO:"Salto",PAYSANDU:"Paysandú",
  RIO_NEGRO:"Río Negro",SORIANO:"Soriano",COLONIA:"Colonia",
  SAN_JOSE:"San José",FLORES:"Flores",FLORIDA:"Florida",
  DURAZNO:"Durazno",TACUAREMBO:"Tacuarembó",LAVALLEJA:"Lavalleja",
};

function RequiredLabel({ children }: { children: string }) {
  return (
    <label className="text-sm text-jm-text-secondary flex items-center gap-1">
      {children}
      <span className="text-jm-red-light">*</span>
    </label>
  );
}

function MessageBanner({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
      message.type === "error"
        ? "bg-jm-red-bg border border-jm-red text-jm-red-light"
        : "bg-jm-green-bg border border-jm-green text-jm-green-light"
    }`}>
      {message.type === "error"
        ? <IconX size={16} className="mt-0.5 flex-shrink-0" />
        : <IconCheck size={16} className="mt-0.5 flex-shrink-0" />}
      <span>{message.text}</span>
    </div>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    department: "",
    modality: "",
    jobType: "",
    salary: "",
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  // Auto-dismiss del mensaje después de 4 segundos
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const showError = (text: string) => setMessage({ type: "error", text });
  const showSuccess = (text: string) => setMessage({ type: "success", text });

  const validate = () => {
    if (!form.title.trim()) { showError("El título de la oferta es obligatorio."); return false; }
    if (form.title.trim().length < 4) { showError("El título debe tener al menos 4 caracteres."); return false; }
    if (!form.description.trim()) { showError("La descripción es obligatoria."); return false; }
    if (form.description.trim().length < 20) { showError("La descripción debe tener al menos 20 caracteres."); return false; }
    if (!form.categoryId) { showError("Seleccioná una categoría."); return false; }
    if (!form.department) { showError("Seleccioná el departamento."); return false; }
    if (!form.modality) { showError("Seleccioná la modalidad de trabajo."); return false; }
    if (!form.jobType) { showError("Seleccioná el tipo de trabajo."); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          salary: form.salary.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Ocurrió un error al crear la oferta. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      showSuccess("¡Oferta creada correctamente! Redirigiendo...");
      setTimeout(() => router.push("/company/dashboard"), 1500);
    } catch {
      showError("Ocurrió un error inesperado. Verificá tu conexión e intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/company/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Nueva oferta de trabajo</h1>

      <div className="bg-jm-card border border-jm-border rounded-2xl p-6 flex flex-col gap-5">

        <div className="flex flex-col gap-1">
          <RequiredLabel>Título de la oferta</RequiredLabel>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            placeholder="Ej: Repositor de mercadería"
          />
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Descripción</RequiredLabel>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta resize-none"
            rows={4}
            placeholder="Describí las tareas, requisitos y condiciones del puesto..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Categoría</RequiredLabel>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
          >
            <option value="">Seleccioná una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Departamento</RequiredLabel>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
          >
            <option value="">Seleccioná el departamento</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Modalidad</RequiredLabel>
          <select
            value={form.modality}
            onChange={(e) => setForm({ ...form, modality: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
          >
            <option value="">Seleccioná la modalidad</option>
            <option value="PRESENTIAL">Presencial</option>
            <option value="REMOTE">Remoto</option>
            <option value="HYBRID">Híbrido</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Tipo de trabajo</RequiredLabel>
          <select
            value={form.jobType}
            onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
          >
            <option value="">Seleccioná el tipo</option>
            <option value="FULL_TIME">Tiempo completo</option>
            <option value="PART_TIME">Medio tiempo</option>
            <option value="TEMPORARY">Temporal</option>
            <option value="PROJECT">Por proyecto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-jm-text-secondary">
            Salario <span className="text-jm-text-tertiary">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            placeholder="Ej: $25.000 - $30.000 o 'A convenir'"
          />
        </div>

        <MessageBanner message={message} />

        <p className="text-xs text-jm-text-tertiary">
          <span className="text-jm-red-light">*</span> Campo obligatorio
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><IconLoader2 size={16} className="animate-spin" />Procesando...</>
          ) : (
            "Publicar oferta"
          )}
        </button>
      </div>
    </div>
  );
}