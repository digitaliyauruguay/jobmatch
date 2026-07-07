/*
 * Archivo: src/app/(public)/workers/page.tsx
 * Qué hace: Página pública de trabajadores disponibles con tema oscuro
 * JobMatch. Muestra perfiles básicos sin datos sensibles, con filtros
 * por categoría y departamento. Cualquier intento de ver el perfil
 * completo redirige al registro. Usa PublicNavbar compartida.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import PublicNavbar from "@/components/ui/PublicNavbar";

type Worker = {
  id: string;
  firstName: string;
  department: string;
  availability: string;
  description: string | null;
  categories: { category: { name: string } }[];
};

type Category = { id: string; name: string };

const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATE: "Disponible de inmediato", ONE_WEEK: "En una semana",
  TWO_WEEKS: "En dos semanas", ONE_MONTH: "En un mes",
};
const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

export default function PublicWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ categoryId: "", department: "" });

  const fetchWorkers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.department) params.append("department", filters.department);
    const res = await fetch(`/api/workers?${params.toString()}`);
    const data = await res.json();
    setWorkers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetchWorkers();
  }, []);

  useEffect(() => { fetchWorkers(); }, [filters]);

  return (
    <main className="min-h-screen bg-jm-black">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-6">
          <h1 className="text-2xl font-medium text-jm-text">Trabajadores disponibles</h1>
          <p className="text-sm text-jm-text-tertiary">{workers.length} trabajadores</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-md">
          <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
            <option value="">Todos los departamentos</option>
            {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-jm-text-tertiary text-sm">Cargando...</p>
        ) : workers.length === 0 ? (
          <p className="text-jm-text-tertiary text-sm">No hay trabajadores disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <div key={worker.id} className="bg-jm-card border border-jm-border rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <p className="font-medium text-jm-text">{worker.firstName}</p>
                  <p className="text-sm text-jm-text-secondary mt-1">{DEPARTMENT_LABELS[worker.department]}</p>
                  <p className="text-xs text-jm-cyan-light mt-1">{AVAILABILITY_LABELS[worker.availability]}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {worker.categories.map((c) => (
                      <Badge key={c.category.name} variant="cyan">{c.category.name}</Badge>
                    ))}
                  </div>
                  {worker.description && (
                    <p className="text-sm text-jm-text-secondary mt-2 line-clamp-2">{worker.description}</p>
                  )}
                </div>
                <Link
                  href="/register"
                  className="mt-4 block w-full text-center bg-jm-magenta text-white py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Ver perfil completo
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}