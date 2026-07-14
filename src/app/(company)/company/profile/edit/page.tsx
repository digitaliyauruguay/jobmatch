/*
 * Archivo: src/app/(company)/company/profile/edit/page.tsx
 * Qué hace: Página para que la empresa edite su perfil con tema
 * oscuro JobMatch. Validación campo por campo en orden, RequiredLabel
 * con asterisco en campos obligatorios, mensajes con ícono y
 * auto-dismiss de 4 segundos, y feedback de procesando/éxito en
 * el botón de guardar. La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FileUpload from "@/components/ui/FileUpload";
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

const PHONE_REGEX = /^09[1-9]\d{6}$/;

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

export default function EditCompanyProfilePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const [form, setForm] = useState({
    name: "",
    department: "",
    contact: "",
    description: "",
    logo: "",
  });

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const fetchData = async () => {
      const [profileRes, categoriesRes] = await Promise.all([
        fetch("/api/companies/me"),
        fetch("/api/categories"),
      ]);
      const profile = await profileRes.json();
      const cats = await categoriesRes.json();
      const categoryIds = profile.categories?.map((c: any) => c.categoryId) || [];
      setCategories(cats);
      setSelectedCategories(categoryIds);
      setForm({
        name: profile.name || "",
        department: profile.department || "",
        contact: profile.contact || "",
        description: profile.description || "",
        logo: profile.logo || "",
      });
      setReady(true);
    };
    fetchData();
  }, []);

  const showError = (text: string) => setMessage({ type: "error", text });
  const showSuccess = (text: string) => setMessage({ type: "success", text });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const validate = () => {
    if (!form.name.trim()) { showError("El nombre de la empresa es obligatorio."); return false; }
    if (form.name.trim().length < 4) { showError("El nombre debe tener al menos 4 caracteres."); return false; }
    if (!form.department) { showError("Seleccioná el departamento."); return false; }
    if (!form.contact.trim()) { showError("El teléfono de contacto es obligatorio."); return false; }
    if (!PHONE_REGEX.test(form.contact.trim())) { showError("El teléfono debe ser un número uruguayo válido (09XXXXXXX)."); return false; }
    if (selectedCategories.length === 0) { showError("Seleccioná al menos una categoría."); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/companies/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          department: form.department,
          contact: form.contact.trim(),
          description: form.description.trim(),
          logo: form.logo || null,
          categoryIds: selectedCategories,
        }),
      });

      if (res.ok) {
        showSuccess("Perfil actualizado correctamente.");
        setTimeout(() => router.push("/company/dashboard"), 1500);
      } else {
        const data = await res.json();
        showError(data.error || "Ocurrió un error al guardar. Intentá de nuevo.");
      }
    } catch {
      showError("Ocurrió un error inesperado. Verificá tu conexión e intentá de nuevo.");
    }

    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-jm-text-tertiary text-sm">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/company/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6">
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Editar perfil de empresa</h1>

      <div className="bg-jm-card border border-jm-border rounded-2xl p-6 flex flex-col gap-5">
        <FileUpload
          type="logo"
          label="Logo de la empresa"
          currentUrl={form.logo}
          onUpload={(url) => setForm({ ...form, logo: url })}
          onRemove={() => setForm({ ...form, logo: "" })}
        />

        <div className="flex flex-col gap-1">
          <RequiredLabel>Nombre de la empresa</RequiredLabel>
          <input type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta" />
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Departamento</RequiredLabel>
          <select value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
            <option value="">Seleccioná el departamento</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <RequiredLabel>Teléfono</RequiredLabel>
          <input type="tel" inputMode="numeric" value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value.replace(/\D/g, "").slice(0, 9) })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            placeholder="09XXXXXXX" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-jm-text-secondary">
            Descripción <span className="text-jm-text-tertiary">(opcional)</span>
          </label>
          <textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta resize-none"
            rows={3} placeholder="Contanos sobre tu empresa..." />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-jm-text-secondary flex items-center gap-1">
            Rubros en los que opera tu empresa
            <span className="text-jm-red-light">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                  style={{
                    backgroundColor: isSelected ? "#993556" : "#1c1b22",
                    color: isSelected ? "#ffffff" : "#84818f",
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer">
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <MessageBanner message={message} />

        <p className="text-xs text-jm-text-tertiary">
          <span className="text-jm-red-light">*</span> Campo obligatorio
        </p>

        <button onClick={handleSubmit} disabled={loading}
          className="bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
          {loading
            ? <><IconLoader2 size={16} className="animate-spin" />Guardando...</>
            : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}