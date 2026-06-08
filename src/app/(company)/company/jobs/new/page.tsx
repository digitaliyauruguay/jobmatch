/*
 * Archivo: src/app/(company)/company/jobs/new/page.tsx
 * Qué hace: Página para que una empresa cree nuevas ofertas de trabajo.
 * Permite seleccionar categoría, departamento, modalidad, tipo de trabajo
 * y completar la información de la oferta. Envía los datos a /api/jobs
 * y redirige al dashboard de la empresa en caso de éxito.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
};

export default function CreateJobPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);

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
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      } finally {
        setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al crear la oferta");
        setLoading(false);
        return;
      }

      router.push("/company/dashboard");
    } catch (error) {
      console.error("Error:", error);
      alert("Error interno del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium">Crear oferta</h1>

          <Link
            href="/company/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Volver
          </Link>
        </div>
      </nav>

      {/* FORM */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-5"
        >
          {/* Título */}
          <div>
            <label className="text-sm font-medium">Título</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Reponedor para supermercado"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm min-h-[120px]"
              placeholder="Describe el puesto, tareas, requisitos, etc."
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="text-sm font-medium">Categoría</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">
                {fetchingCategories ? "Cargando..." : "Seleccionar categoría"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Departamento */}
          <div>
            <label className="text-sm font-medium">Departamento</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
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

          {/* Modalidad */}
          <div>
            <label className="text-sm font-medium">Modalidad</label>
            <select
              name="modality"
              value={form.modality}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              <option value="PRESENTIAL">Presencial</option>
              <option value="REMOTE">Remoto</option>
              <option value="HYBRID">Híbrido</option>
            </select>
          </div>

          {/* Tipo de trabajo */}
          <div>
            <label className="text-sm font-medium">Tipo de trabajo</label>
            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
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

          {/* Salario */}
          <div>
            <label className="text-sm font-medium">Salario (opcional)</label>
            <input
              type="text"
              name="salary"
              value={form.salary}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: $25.000 - $35.000"
            />
          </div>

          {/* Botón */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Publicando..." : "Publicar oferta"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}