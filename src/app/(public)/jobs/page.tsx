/*
 * Archivo: src/app/(public)/jobs/page.tsx
 * Qué hace: Página pública de ofertas de trabajo con tema oscuro
 * JobMatch. Muestra todas las ofertas activas con filtros por
 * categoría, departamento, modalidad y fecha. No muestra datos
 * sensibles. Cualquier intento de interacción redirige al registro.
 * Usa PublicNavbar compartida con la home y /workers.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

type Job = {
  id: string;
  title: string;
  modality: string;
  jobType: string;
  department: string;
  salary: string | null;
  createdAt: string;
  category: { name: string };
  company: { name: string; department: string };
};

type Category = { id: string; name: string };

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: "Presencial", REMOTE: "Remoto", HYBRID: "Híbrido",
};
const JOBTYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Tiempo completo", PART_TIME: "Medio tiempo",
  TEMPORARY: "Temporal", PROJECT: "Por proyecto",
};
const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoryId: "", department: "", modality: "", date: "",
  });

  const fetchJobs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.department) params.append("department", filters.department);
    if (filters.modality) params.append("modality", filters.modality);
    if (filters.date) params.append("date", filters.date);
    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetchJobs();
  }, []);

  useEffect(() => { fetchJobs(); }, [filters]);

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-6">
          <h1 className="text-2xl font-medium text-jm-text">Ofertas de trabajo</h1>
          <p className="text-sm text-jm-text-tertiary">{jobs.length} ofertas disponibles</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
          <select value={filters.modality} onChange={(e) => setFilters({ ...filters, modality: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
            <option value="">Todas las modalidades</option>
            <option value="PRESENTIAL">Presencial</option>
            <option value="REMOTE">Remoto</option>
            <option value="HYBRID">Híbrido</option>
          </select>
          <select value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
            <option value="">Cualquier fecha</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>

        {loading ? (
          <p className="text-jm-text-tertiary text-sm">Cargando ofertas...</p>
        ) : jobs.length === 0 ? (
          <p className="text-jm-text-tertiary text-sm">No hay ofertas disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-jm-card border border-jm-border rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <p className="font-medium text-jm-text">{job.title}</p>
                  <p className="text-sm text-jm-text-secondary mt-1">
                    {job.company.name} · {DEPARTMENT_LABELS[job.department]}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="cyan">{job.category.name}</Badge>
                    <Badge variant="gray">{MODALITY_LABELS[job.modality]}</Badge>
                    <Badge variant="gray">{JOBTYPE_LABELS[job.jobType]}</Badge>
                  </div>
                  {job.salary && <p className="text-sm text-jm-green-light mt-2">{job.salary}</p>}
                </div>
                <Link
                  href="/register"
                  className="mt-4 block w-full text-center bg-jm-magenta text-white py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Postularme
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}