/*
 * Archivo: src/app/(company)/company/jobs/[id]/edit/page.tsx
 * Qué hace: Página para que la empresa edite una oferta de trabajo
 * existente con tema oscuro JobMatch. Precarga los datos actuales y
 * permite modificar todos los campos. Usa el endpoint PUT /api/jobs/[id]
 * para guardar cambios. La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

type Category = {
  id: string;
  name: string;
};

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    modality: "",
    jobType: "",
    salary: "",
    categoryId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [jobRes, categoriesRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch("/api/categories"),
      ]);

      const job = await jobRes.json();
      const cats = await categoriesRes.json();

      setCategories(cats);
      setForm({
        title: job.title || "",
        description: job.description || "",
        department: job.department || "",
        modality: job.modality || "",
        jobType: job.jobType || "",
        salary: job.salary || "",
        categoryId: job.categoryId || "",
      });
      setReady(true);
    };

    fetchData();
  }, [jobId]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/company/dashboard"), 1500);
    } else {
      const data = await res.json();
      setError(data.error || "Error al actualizar la oferta");
    }

    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-jm-text-tertiary text-sm">Cargando oferta...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/company/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Editar oferta</h1>

      <div className="bg-jm-card border border-jm-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta min-h-[120px]"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Categoría</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Departamento</label>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
            required
          >
            <option value="">Seleccionar</option>
            <option value="MONTEVIDEO">Montevideo</option>
            <option value="CANELONES">Canelones</option>
            <option value="MALDONADO">Maldonado</option>
            <option value="ROCHA">Rocha</option>
            <option value="TREINTA_Y_TRES">Treinta y Tres</option>
            <option value="CERRO_LARGO">Cerro Largo</option>
            <option value="RIVERA">Rivera</option>
            <option value="ARTIGAS">Artigas</option>
            <option value="SALTO">Salto</option>
            <option value="PAYSANDU">Paysandú</option>
            <option value="RIO_NEGRO">Río Negro</option>
            <option value="SORIANO">Soriano</option>
            <option value="COLONIA">Colonia</option>
            <option value="SAN_JOSE">San José</option>
            <option value="FLORES">Flores</option>
            <option value="FLORIDA">Florida</option>
            <option value="DURAZNO">Durazno</option>
            <option value="TACUAREMBO">Tacuarembó</option>
            <option value="LAVALLEJA">Lavalleja</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Modalidad</label>
          <select
            value={form.modality}
            onChange={(e) => setForm({ ...form, modality: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
            required
          >
            <option value="">Seleccionar</option>
            <option value="PRESENTIAL">Presencial</option>
            <option value="REMOTE">Remoto</option>
            <option value="HYBRID">Híbrido</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Tipo de trabajo</label>
          <select
            value={form.jobType}
            onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
            required
          >
            <option value="">Seleccionar</option>
            <option value="FULL_TIME">Tiempo completo</option>
            <option value="PART_TIME">Medio tiempo</option>
            <option value="TEMPORARY">Temporal</option>
            <option value="PROJECT">Por proyecto</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-jm-text-secondary">Salario (opcional)</label>
          <input
            type="text"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="w-full mt-1 bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            placeholder="Ej: $25.000 - $35.000"
          />
        </div>

        {error && <p className="text-jm-red-light text-sm">{error}</p>}
        {success && <p className="text-jm-green-light text-sm">Oferta actualizada correctamente.</p>}

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-jm-magenta text-white py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}