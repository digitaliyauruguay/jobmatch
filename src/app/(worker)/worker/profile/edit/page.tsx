/*
 * Archivo: src/app/(worker)/worker/profile/edit/page.tsx
 * Qué hace: Página para que el trabajador edite su perfil después
 * del registro. Permite actualizar todos sus datos, cambiar la foto
 * de perfil, subir un nuevo CV y modificar sus categorías.
 * Usa el endpoint PUT /api/workers/me para guardar los cambios.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FileUpload from "@/components/ui/FileUpload";

type Category = {
  id: string;
  name: string;
};

const DEPARTMENTS = [
  "MONTEVIDEO", "CANELONES", "MALDONADO", "ROCHA", "TREINTA_Y_TRES",
  "CERRO_LARGO", "RIVERA", "ARTIGAS", "SALTO", "PAYSANDU", "RIO_NEGRO",
  "SORIANO", "COLONIA", "SAN_JOSE", "FLORES", "FLORIDA", "DURAZNO",
  "TACUAREMBO", "LAVALLEJA",
];

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATE: "Disponible de inmediato",
  ONE_WEEK: "En una semana",
  TWO_WEEKS: "En dos semanas",
  ONE_MONTH: "En un mes",
};

export default function EditWorkerProfilePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    availability: "",
    description: "",
    photo: "",
    cvUrl: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [profileRes, categoriesRes] = await Promise.all([
        fetch("/api/workers/me"),
        fetch("/api/categories"),
      ]);

      const profile = await profileRes.json();
      const cats = await categoriesRes.json();

      const categoryIds = profile.categories?.map((c: any) => c.categoryId) || [];

      setCategories(cats);
      setSelectedCategories(categoryIds);
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        department: profile.department || "",
        availability: profile.availability || "",
        description: profile.description || "",
        photo: profile.photo || "",
        cvUrl: profile.cvUrl || "",
      });
      setReady(true);
    };

    fetchData();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.department || !form.phone || !form.availability) {
      setError("Completá todos los campos obligatorios");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Seleccioná al menos una categoría");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/workers/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryIds: selectedCategories }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/worker/dashboard"), 1500);
    } else {
      const data = await res.json();
      setError(data.error);
    }

    setLoading(false);
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando perfil...</p>
      </main>
    );
  }
console.log("categories IDs:", categories.map(c => c.id));
console.log("selectedCategories:", selectedCategories);
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium">Editar perfil</h1>
          <Link href="/worker/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">

          <FileUpload
            type="photo"
            label="Foto de perfil"
            currentUrl={form.photo}
            onUpload={(url) => setForm({ ...form, photo: url })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">Nombre</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">Apellido</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="09X XXX XXX"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Departamento</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccioná tu departamento</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Disponibilidad</label>
            <select
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">¿Cuándo podés empezar?</option>
              {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Sobre vos (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Contanos algo sobre vos..."
            />
          </div>

          <FileUpload
            type="cv"
            label="CV en PDF (opcional)"
            currentUrl={form.cvUrl}
            onUpload={(url) => setForm({ ...form, cvUrl: url })}
          />

          <div className="flex flex-wrap gap-2">
  {categories.map((cat) => {
    const isSelected = selectedCategories.includes(cat.id);
    console.log(`cat.id: ${cat.id} | isSelected: ${isSelected}`);
    return (
      <button
  key={cat.id}
  type="button"
  onClick={() => toggleCategory(cat.id)}
  style={{
    backgroundColor: isSelected ? "#2563eb" : "#f3f4f6",
    color: isSelected ? "white" : "#374151",
  }}
  className="px-3 py-1.5 rounded-lg text-sm transition-colors"
>
  {cat.name}
</button>
    );
  })}
</div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">Perfil actualizado correctamente.</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </main>
  );
}