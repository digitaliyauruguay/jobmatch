/*
 * Archivo: src/app/(company)/company/workers/page.tsx
 * Qué hace: Página para que la empresa busque trabajadores disponibles
 * y los indique para una de sus ofertas publicadas. Filtros por categoría,
 * departamento, disponibilidad y si tienen CV cargado. Feedback inline
 * en el botón de indicar. La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconFileText, IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";

type Worker = {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  availability: string;
  description: string | null;
  phone: string;
  cvUrl: string | null;
  categories: { category: { name: string } }[];
};

type Job = { id: string; title: string };
type Category = { id: string; name: string };
type IndicateState = { [workerId: string]: "idle" | "loading" | "success" | "indicated" };

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

export default function CompanyWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicateState, setIndicateState] = useState<IndicateState>({});
  const [selectedJob, setSelectedJob] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
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
    const fetchInitial = async () => {
      const [jobsRes, categoriesRes] = await Promise.all([
        fetch("/api/companies/me/jobs"),
        fetch("/api/categories"),
      ]);
      const jobsData = await jobsRes.json();
      const categoriesData = await categoriesRes.json();
      setJobs(jobsData.filter((j: any) => j.status === "ACTIVE"));
      setCategories(categoriesData);
    };
    fetchInitial();
    fetchWorkers();
  }, []);

  useEffect(() => { fetchWorkers(); }, [filters]);

  const handleIndicate = async (workerId: string) => {
    const jobId = selectedJob[workerId];
    if (!jobId) {
      setError({ ...error, [workerId]: "Seleccioná una oferta primero" });
      return;
    }
    setIndicateState((prev) => ({ ...prev, [workerId]: "loading" }));
    setError({ ...error, [workerId]: "" });

    const res = await fetch("/api/applications/indicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, workerId }),
    });
    const data = await res.json();

    if (res.ok) {
      setIndicateState((prev) => ({ ...prev, [workerId]: "success" }));
      setTimeout(() => setIndicateState((prev) => ({ ...prev, [workerId]: "indicated" })), 1500);
    } else {
      setError({ ...error, [workerId]: data.error });
      setIndicateState((prev) => ({ ...prev, [workerId]: "idle" }));
    }
  };

  const renderIndicateButton = (worker: Worker) => {
    const state = indicateState[worker.id] || "idle";
    if (state === "loading") return (
      <div className="flex items-center gap-2 px-4 py-2 bg-jm-card-hover rounded-lg text-sm text-jm-text-secondary">
        <IconLoader2 size={14} className="animate-spin" />Procesando...
      </div>
    );
    if (state === "success") return (
      <div className="flex items-center gap-2 px-4 py-2 bg-jm-green-bg rounded-lg text-sm text-jm-green-light">
        <IconCheck size={14} />Trabajador indicado
      </div>
    );
    if (state === "indicated") return (
      <div className="px-4 py-2 bg-jm-card-hover rounded-lg text-sm text-jm-text-tertiary text-center">Ya indicado</div>
    );
    return (
      <button onClick={() => handleIndicate(worker.id)}
        className="w-full bg-jm-magenta text-white py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
        Indicar para esta oferta
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/company/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6">
        <IconArrowLeft size={16} />Volver
      </Link>
      <h1 className="text-xl font-medium text-jm-text mb-6">Buscar trabajadores</h1>

      {jobs.length === 0 && !loading && (
        <div className="bg-jm-cyan-bg border border-jm-cyan rounded-lg p-4 mb-6">
          <p className="text-sm text-jm-cyan-light">
            No tenés ofertas activas. Creá una oferta primero para poder indicar trabajadores.
          </p>
        </div>
      )}

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
        <p className="text-jm-text-tertiary text-sm">Cargando trabajadores...</p>
      ) : workers.length === 0 ? (
        <p className="text-jm-text-tertiary text-sm">No hay trabajadores disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-jm-card border border-jm-border rounded-lg p-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-jm-text">{worker.firstName} {worker.lastName}</p>
                {worker.cvUrl && (
                  <span className="flex items-center gap-1 text-xs text-jm-cyan-light flex-shrink-0">
                    <IconFileText size={13} />CV
                  </span>
                )}
              </div>
              <p className="text-sm text-jm-text-secondary">{DEPARTMENT_LABELS[worker.department]}</p>
              <p className="text-xs text-jm-cyan-light mt-1">{AVAILABILITY_LABELS[worker.availability]}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {worker.categories.map((c) => (
                  <Badge key={c.category.name} variant="cyan">{c.category.name}</Badge>
                ))}
              </div>
              {worker.description && (
                <p className="text-sm text-jm-text-secondary mt-2 line-clamp-2">{worker.description}</p>
              )}
              {worker.cvUrl && (
                <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(worker.cvUrl)}&embedded=false`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-jm-cyan-light text-xs hover:underline mt-2 cursor-pointer">
                  <IconFileText size={13} />Ver CV
                </a>
              )}

              {jobs.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <select value={selectedJob[worker.id] || ""}
                    onChange={(e) => setSelectedJob({ ...selectedJob, [worker.id]: e.target.value })}
                    className="bg-jm-card-hover border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
                    <option value="">Seleccioná una oferta</option>
                    {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                  </select>
                  {error[worker.id] && <p className="text-jm-red-light text-xs">{error[worker.id]}</p>}
                  {renderIndicateButton(worker)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}