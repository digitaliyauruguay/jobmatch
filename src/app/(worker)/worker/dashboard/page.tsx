/*
 * Archivo: src/app/(worker)/worker/dashboard/page.tsx
 * Qué hace: Dashboard principal del trabajador. Muestra su perfil,
 * las ofertas disponibles con filtros, y sus postulaciones organizadas
 * por estado y origen (propia o indicación de empresa).
 * El trabajador puede postularse a ofertas directamente desde acá.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/ui/NotificationBell";

type Job = {
  id: string;
  title: string;
  description: string;
  modality: string;
  jobType: string;
  department: string;
  salary: string | null;
  createdAt: string;
  category: { name: string };
  company: { name: string; department: string };
};

type Application = {
  id: string;
  origin: string;
  status: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    modality: string;
    category: { name: string };
    company: { name: string };
  };
};

type Category = {
  id: string;
  name: string;
};

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: "Presencial",
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
};

const JOBTYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  TEMPORARY: "Temporal",
  PROJECT: "Por proyecto",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

export default function WorkerDashboard() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<"jobs" | "applications">("jobs");

  // Ofertas
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({
    categoryId: "",
    department: "",
    modality: "",
    date: "",
  });

  // Postulaciones
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appTab, setAppTab] = useState<"SELF" | "INDICATED">("SELF");

  // Postulando
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.department) params.append("department", filters.department);
    if (filters.modality) params.append("modality", filters.modality);
    if (filters.date) params.append("date", filters.date);

    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();
    setJobs(data);
    setLoadingJobs(false);
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    const res = await fetch("/api/applications/me");
    const data = await res.json();
    setApplications(data);
    setAppliedJobs(data.map((a: Application) => a.job.id));
    setLoadingApps(false);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
  fetchCategories();
  fetchJobs();
  fetchApplications();
}, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  useEffect(() => {
    if (activeSection === "applications") {
      fetchApplications();
    }
  }, [activeSection]);

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });

    if (res.ok) {
      fetchApplications();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setApplying(null);
  };

  const filteredApplications = applications.filter(
    (a) => a.origin === appTab
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium">JobMatch</h1>
          <div className="flex items-center gap-4">
  <span className="text-sm text-gray-600">{session?.user?.email}</span>
  <NotificationBell />
  <button
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="text-sm text-gray-500 hover:text-gray-900"
  >
    Salir
  </button>
</div>
        </div>
      </nav>

      {/* Tabs principales */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSection("jobs")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === "jobs"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Ofertas disponibles
            </button>
            <button
              onClick={() => setActiveSection("applications")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === "applications"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Mis postulaciones
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sección ofertas */}
        {activeSection === "jobs" && (
          <>
            {/* Filtros */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos los departamentos</option>
                {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                value={filters.modality}
                onChange={(e) => setFilters({ ...filters, modality: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Todas las modalidades</option>
                <option value="PRESENTIAL">Presencial</option>
                <option value="REMOTE">Remoto</option>
                <option value="HYBRID">Híbrido</option>
              </select>

              <select
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>

            {/* Lista de ofertas */}
            {loadingJobs ? (
              <p className="text-gray-500 text-sm">Cargando ofertas...</p>
            ) : jobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay ofertas disponibles.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg border border-gray-200 p-5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {job.company.name} · {DEPARTMENT_LABELS[job.department]}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {job.category.name}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {MODALITY_LABELS[job.modality]}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {JOBTYPE_LABELS[job.jobType]}
                          </span>
                        </div>
                        {job.salary && (
                          <p className="text-sm text-green-700 mt-2">{job.salary}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
  onClick={() => !appliedJobs.includes(job.id) && handleApply(job.id)}
  disabled={applying === job.id || appliedJobs.includes(job.id)}
  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
    appliedJobs.includes(job.id)
      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
      : "bg-blue-600 text-white hover:bg-blue-700"
  } disabled:opacity-50`}
>
  {applying === job.id
    ? "Postulando..."
    : appliedJobs.includes(job.id)
    ? "Ya postulado"
    : "Postularme"}
</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sección postulaciones */}
        {activeSection === "applications" && (
          <>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAppTab("SELF")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  appTab === "SELF"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                Mis postulaciones
              </button>
              <button
                onClick={() => setAppTab("INDICATED")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  appTab === "INDICATED"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                Indicaciones recibidas
              </button>
            </div>

            {loadingApps ? (
              <p className="text-gray-500 text-sm">Cargando...</p>
            ) : filteredApplications.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {appTab === "SELF"
                  ? "Todavía no te postulaste a ninguna oferta."
                  : "Todavía no recibiste indicaciones de empresas."}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{app.job.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {app.job.company.name} · {app.job.category.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {MODALITY_LABELS[app.job.modality]}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === "PENDING"
                        ? "bg-yellow-50 text-yellow-700"
                        : app.status === "APPROVED"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {app.status === "PENDING" && "Pendiente"}
                      {app.status === "APPROVED" && "Aprobado"}
                      {app.status === "REJECTED" && "Rechazado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}