/*
 * Archivo: src/app/(company)/company/jobs/[id]/edit/page.tsx
 * Qué hace: Página para que la empresa edite una oferta de trabajo
 * existente. Precarga los datos actuales y permite modificar todos
 * los campos. Usa el endpoint PUT /api/jobs/[id] para guardar cambios.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando oferta...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium">Editar oferta</h1>
          <Link href="/company/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div>
            <label className="text-sm font-medium">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm min-h-[120px]"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Categoría</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Departamento</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
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
            <label className="text-sm font-medium">Modalidad</label>
            <select
              value={form.modality}
              onChange={(e) => setForm({ ...form, modality: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              <option value="PRESENTIAL">Presencial</option>
              <option value="REMOTE">Remoto</option>
              <option value="HYBRID">Híbrido</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Tipo de trabajo</label>
            <select
              value={form.jobType}
              onChange={(e) => setForm({ ...form, jobType: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
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
            <label className="text-sm font-medium">Salario (opcional)</label>
            <input
              type="text"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: $25.000 - $35.000"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">Oferta actualizada correctamente.</p>}

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}