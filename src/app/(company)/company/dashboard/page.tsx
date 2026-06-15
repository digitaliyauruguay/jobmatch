/*
 * Archivo: src/app/(company)/company/dashboard/page.tsx
 * Qué hace: Dashboard principal de la empresa. Muestra las ofertas
 * publicadas y para cada una las postulaciones recibidas discriminadas
 * por origen (SELF / INDICATED) y estado (PENDING / APPROVED / REJECTED).
 * La empresa puede aprobar o rechazar postulaciones desde acá.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/ui/NotificationBell";

type Application = {
  id: string;
  origin: string;
  status: string;
  createdAt: string;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    phone: string;
    availability: string;
    cvUrl: string | null;
    categories: { category: { name: string } }[];
  };
};

type Job = {
  id: string;
  title: string;
  status: string;
  modality: string;
  jobType: string;
  department: string;
  salary: string | null;
  createdAt: string;
  category: { name: string };
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

const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATE: "Disponible de inmediato",
  ONE_WEEK: "En una semana",
  TWO_WEEKS: "En dos semanas",
  ONE_MONTH: "En un mes",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

export default function CompanyDashboard() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [activeTab, setActiveTab] = useState<"SELF" | "INDICATED">("SELF");
  const [profile, setProfile] = useState<{ name: string; logo: string | null } | null>(null);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    const res = await fetch("/api/companies/me/jobs");
    const data = await res.json();
    setJobs(data);
    setLoadingJobs(false);
  };

  const fetchProfile = async () => {
  const res = await fetch("/api/companies/me");
  const data = await res.json();
  setProfile(data);
  };

  const fetchApplications = async (jobId: string) => {
    setLoadingApps(true);
    const res = await fetch(`/api/applications/job/${jobId}`);
    const data = await res.json();
    setApplications(data);
    setLoadingApps(false);
  };

 useEffect(() => {
  fetchJobs();
  fetchProfile();
}, []);

  const handleSelectJob = (jobId: string) => {
    setSelectedJob(jobId);
    fetchApplications(jobId);
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok && selectedJob) {
      fetchApplications(selectedJob);
    }
  };

  const filteredApplications = applications.filter(
    (a) => a.origin === activeTab
  );

  const selectedJobData = jobs.find((j) => j.id === selectedJob);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium">JobMatch — Empresa</h1>
          <div className="flex items-center gap-4">
  <div className="flex items-center gap-3">
  {profile?.logo ? (
    <img
      src={profile.logo}
      alt="Logo de empresa"
      className="w-8 h-8 rounded-full object-cover border border-gray-200"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
      {profile?.name?.[0] || session?.user?.email?.[0]?.toUpperCase()}
    </div>
  )}
  <span className="text-sm text-gray-600">{profile?.name || session?.user?.email}</span>
</div>
  <NotificationBell />
  <Link
  href="/company/workers"
  className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
>
  Buscar trabajadores
</Link>
<Link
  href="/company/jobs/new"
  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
>
  Nueva oferta
</Link>
  <button
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="text-sm text-gray-500 hover:text-gray-900"
  >
    Salir
  </button>
</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel izquierdo — ofertas */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-medium mb-4">Tus ofertas</h2>
          {loadingJobs ? (
            <p className="text-gray-500 text-sm">Cargando...</p>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm mb-4">No tenés ofertas publicadas.</p>
              <Link
                href="/company/jobs/new"
                className="text-blue-600 text-sm hover:underline"
              >
                Crear tu primera oferta
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  style={{
  border: selectedJob === job.id ? "1px solid #3b82f6" : "1px solid #e5e7eb",
}}
className="text-left bg-white rounded-lg p-4 transition-colors"
                >
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {job.category.name} · {MODALITY_LABELS[job.modality]}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {DEPARTMENT_LABELS[job.department]}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho — postulaciones */}
        <div className="md:col-span-2">
          {!selectedJob ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">
                Seleccioná una oferta para ver sus postulaciones.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">
                  {selectedJobData?.title}
                </h2>
              </div>

              {/* Tabs SELF / INDICATED */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("SELF")}
                  style={{
  backgroundColor: activeTab === "SELF" ? "#2563eb" : "white",
  color: activeTab === "SELF" ? "white" : "#4b5563",
  border: activeTab === "SELF" ? "none" : "1px solid #e5e7eb",
}}
className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Postulaciones recibidas
                </button>
                <button
                  onClick={() => setActiveTab("INDICATED")}
                  style={{
  backgroundColor: activeTab === "INDICATED" ? "#2563eb" : "white",
  color: activeTab === "INDICATED" ? "white" : "#4b5563",
  border: activeTab === "INDICATED" ? "none" : "1px solid #e5e7eb",
}}
className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Indicados por mí
                </button>
              </div>

              {loadingApps ? (
                <p className="text-gray-500 text-sm">Cargando...</p>
              ) : filteredApplications.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    {activeTab === "SELF"
                      ? "No hay postulaciones para esta oferta todavía."
                      : "No indicaste trabajadores para esta oferta todavía."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredApplications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {app.worker.firstName} {app.worker.lastName}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {DEPARTMENT_LABELS[app.worker.department]} · {AVAILABILITY_LABELS[app.worker.availability]}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.worker.categories.map((c) => (
                              <span
                                key={c.category.name}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {c.category.name}
                              </span>
                            ))}
                          </div>
                          {app.worker.cvUrl && (
                            <a
                              href={app.worker.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-xs hover:underline mt-2 inline-block"
                            >
                              Ver CV
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
  style={{
    backgroundColor: app.status === "PENDING" ? "#fefce8" : app.status === "APPROVED" ? "#f0fdf4" : "#fef2f2",
    color: app.status === "PENDING" ? "#a16207" : app.status === "APPROVED" ? "#15803d" : "#b91c1c",
  }}
  className="px-2 py-1 rounded-full text-xs font-medium"
>
                            {app.status === "PENDING" && "Pendiente"}
                            {app.status === "APPROVED" && "Aprobado"}
                            {app.status === "REJECTED" && "Rechazado"}
                          </span>
                          {app.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateApplicationStatus(app.id, "APPROVED")}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(app.id, "REJECTED")}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}