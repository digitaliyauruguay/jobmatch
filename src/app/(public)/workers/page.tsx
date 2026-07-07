/*
 * Archivo: src/app/(public)/workers/page.tsx
 * Qué hace: Página pública de trabajadores disponibles con tema oscuro
 * JobMatch. Muestra perfiles básicos sin datos sensibles, con filtros
 * por categoría, departamento, disponibilidad y si tienen CV cargado.
 * Cualquier intento de ver el perfil completo redirige al registro.
 * Usa PublicNavbar compartida via layout.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconFileText } from "@tabler/icons-react";

type Worker = {
  id: string;
  firstName: string;
  department: string;
  availability: string;
  description: string | null;
  hasCV: boolean;
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
  const [filters, setFilters] = useState({
    categoryId: "", department: "", availability: "", hasCV: "",
  });

  const fetchWorkers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.department) params.append("department", filters.department);
    if (filters.availability) params.append("availability", filters.availability);
    if (filters.hasCV) params.append("hasCV", filters.hasCV);
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
    <main>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-6">
          <h1 className="text-2xl font-medium text-jm-text">Trabajadores disponibles</h1>
          <p className="text-sm text-jm-text-tertiary">{workers.length} trabajadores</p>
        </div>

        {/* Filtros — 1 columna en mobile, 2 desde sm, 4 desde md */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta hover:border-jm-magenta transition-colors cursor-pointer">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta hover:border-jm-magenta transition-colors cursor-pointer">
            <option value="">Todos los departamentos</option>
            {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.availability} onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta hover:border-jm-magenta transition-colors cursor-pointer">
            <option value="">Cualquier disponibilidad</option>
            {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="flex items-center gap-2 bg-jm-card border border-jm-border rounded-lg px-3 py-2 cursor-pointer hover:border-jm-magenta transition-colors">
          <input
            type="checkbox"
            checked={filters.hasCV === "true"}
            onChange={(e) => setFilters({ ...filters, hasCV: e.target.checked ? "true" : "" })}
            className="w-4 h-4 accent-jm-magenta cursor-pointer flex-shrink-0"
          />
          <span className="text-sm text-jm-text-secondary">Solo con CV cargado</span>
        </label>
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-jm-text">{worker.firstName}</p>
                    {worker.hasCV && (
                      <span className="flex items-center gap-1 text-xs text-jm-cyan-light">
                        <IconFileText size={13} />CV
                      </span>
                    )}
                  </div>
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