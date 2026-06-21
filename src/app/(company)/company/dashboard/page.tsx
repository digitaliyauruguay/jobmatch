/*
 * Archivo: src/app/(company)/company/dashboard/page.tsx
 * Qué hace: Dashboard principal de la empresa con tema oscuro JobMatch.
 * Muestra las ofertas publicadas y para cada una las postulaciones
 * recibidas discriminadas por origen (SELF / INDICATED) y estado.
 * La empresa puede aprobar o rechazar postulaciones propias (SELF) y
 * solo ver el estado de las indicaciones (INDICATED), que el trabajador
 * acepta o rechaza. La navbar ahora la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { IconUsers, IconPlus, IconFileText, IconInfoCircle } from "@tabler/icons-react";

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [activeTab, setActiveTab] = useState<"SELF" | "INDICATED">("SELF");
  const [jobFilter, setJobFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED" | "DELETED" | "COMPLETED">("ACTIVE");

  const fetchJobs = async () => {
    setLoadingJobs(true);
    const res = await fetch("/api/companies/me/jobs");
    const data = await res.json();
    setJobs(data);
    setLoadingJobs(false);
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
    const jobsInterval = setInterval(fetchJobs, 30000);
    return () => clearInterval(jobsInterval);
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    const appsInterval = setInterval(() => {
      fetchApplications(selectedJob);
    }, 30000);
    return () => clearInterval(appsInterval);
  }, [selectedJob]);

  useEffect(() => {
    if (selectedJob) {
      const job = jobs.find((j) => j.id === selectedJob);
      if (job && job.status !== "ACTIVE") {
        setSelectedJob(null);
      }
    }
  }, [jobs, selectedJob]);

  const [selectError, setSelectError] = useState("");

const handleSelectJob = (jobId: string, jobStatus: string) => {
  if (jobStatus !== "ACTIVE") {
    setSelectError("Esta oferta no está activa, por eso no podés ver sus postulaciones.");
    setTimeout(() => setSelectError(""), 4000);
    return;
  }
  setSelectError("");
  setSelectedJob(jobId);
  fetchApplications(jobId);
};

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta oferta? Esta acción no se puede deshacer.")) {
      return;
    }

    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });

    if (res.ok) {
      fetchJobs();
      if (selectedJob === jobId) setSelectedJob(null);
    } else {
      alert("Error al eliminar la oferta");
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm("¿Marcar esta oferta como completada?")) return;

    const res = await fetch(`/api/jobs/${jobId}/complete`, { method: "PATCH" });

    if (res.ok) {
      fetchJobs();
    } else {
      alert("Error al completar la oferta");
    }
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

  const filteredApplications = applications.filter((a) => a.origin === activeTab);
  const selectedJobData = jobs.find((j) => j.id === selectedJob);

  const visibleJobs = jobs.filter((j) => jobFilter === "ALL" || j.status === jobFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Acciones rápidas */}
      <div className="flex justify-end gap-3 mb-6">
        <Link
          href="/company/workers"
          className="flex items-center gap-1.5 border border-jm-border-soft text-jm-text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:border-jm-gray transition-colors cursor-pointer"
        >
          <IconUsers size={16} />
          Buscar trabajadores
        </Link>
        <Link
          href="/company/jobs/new"
          className="flex items-center gap-1.5 bg-jm-magenta text-white px-4 py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <IconPlus size={16} />
          Nueva oferta
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel izquierdo — ofertas */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-medium text-jm-text mb-4">Tus ofertas</h2>

          <div className="flex gap-2 mb-4 flex-wrap">
  {(["ALL", "ACTIVE", "BLOCKED", "COMPLETED", "DELETED"] as const).map((s) => (
    <button
      key={s}
      onClick={() => setJobFilter(s)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        jobFilter === s
          ? "bg-jm-magenta text-white"
          : "bg-jm-card text-jm-text-secondary border border-jm-border"
      }`}
    >
      {s === "ALL" && "Todas"}
      {s === "ACTIVE" && "Activas"}
      {s === "BLOCKED" && "Bloqueadas"}
      {s === "COMPLETED" && "Completadas"}
      {s === "DELETED" && "Eliminadas"}
    </button>
  ))}
</div>

          {loadingJobs ? (
            <p className="text-jm-text-tertiary text-sm">Cargando...</p>
          ) : visibleJobs.length === 0 ? (
            <div className="bg-jm-card border border-jm-border rounded-lg p-6 text-center">
              <p className="text-jm-text-tertiary text-sm mb-4">No tenés ofertas en este estado.</p>
              {jobFilter === "ACTIVE" && (
                <Link href="/company/jobs/new" className="text-jm-cyan-light text-sm hover:underline cursor-pointer">
                  Crear tu primera oferta
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-jm-card rounded-lg p-4 transition-colors"
                    style={{
                      border: selectedJob === job.id ? "1px solid #993556" : "1px solid #232229",
                    }}
                  >
                    <button
                      onClick={() => handleSelectJob(job.id, job.status)}
                      className="text-left w-full cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-jm-text">{job.title}</p>
                        {job.status !== "ACTIVE" && (
                          <Badge variant={job.status === "BLOCKED" ? "red" : job.status === "COMPLETED" ? "cyan" : "gray"}>
                            {job.status === "BLOCKED" && "Bloqueada"}
                            {job.status === "COMPLETED" && "Completada"}
                            {job.status === "DELETED" && "Eliminada"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-jm-text-secondary mt-1">
                        {job.category.name} · {MODALITY_LABELS[job.modality]}
                      </p>
                      <p className="text-xs text-jm-text-tertiary mt-1">
                        {DEPARTMENT_LABELS[job.department]}
                      </p>
                    </button>
                    {job.status === "ACTIVE" && (
                      <div className="flex gap-3 mt-3">
                        <Link href={`/company/jobs/${job.id}/edit`} className="text-xs text-jm-cyan-light hover:underline cursor-pointer">
                          Editar
                        </Link>
                        <button onClick={() => handleCompleteJob(job.id)} className="text-xs text-jm-green-light hover:underline cursor-pointer">
                          Marcar completada
                        </button>
                        <button onClick={() => handleDeleteJob(job.id)} className="text-xs text-jm-red-light hover:underline cursor-pointer">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Panel derecho — postulaciones */}
        <div className="md:col-span-2">
          {!selectedJob ? (
  <div
    className={`rounded-lg p-8 text-center transition-colors duration-300 ${
      selectError
        ? "bg-jm-cyan-bg border border-jm-cyan"
        : "bg-jm-card border border-jm-border"
    }`}
  >
    {selectError && (
      <IconInfoCircle size={24} className="text-jm-cyan-light mx-auto mb-2" />
    )}
    <p className={`text-sm ${selectError ? "text-jm-cyan-light font-medium" : "text-jm-text-tertiary"}`}>
      {selectError || "Seleccioná una oferta para ver sus postulaciones."}
    </p>
  </div>
) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-jm-text">{selectedJobData?.title}</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("SELF")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "SELF"
                      ? "bg-jm-magenta text-white"
                      : "bg-jm-card text-jm-text-secondary border border-jm-border"
                  }`}
                >
                  Postulaciones recibidas
                </button>
                <button
                  onClick={() => setActiveTab("INDICATED")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "INDICATED"
                      ? "bg-jm-magenta text-white"
                      : "bg-jm-card text-jm-text-secondary border border-jm-border"
                  }`}
                >
                  Indicados por mí
                </button>
              </div>

              {loadingApps ? (
                <p className="text-jm-text-tertiary text-sm">Cargando...</p>
              ) : filteredApplications.length === 0 ? (
                <div className="bg-jm-card border border-jm-border rounded-lg p-6 text-center">
                  <p className="text-jm-text-tertiary text-sm">
                    {activeTab === "SELF"
                      ? "No hay postulaciones para esta oferta todavía."
                      : "No indicaste trabajadores para esta oferta todavía."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="bg-jm-card border border-jm-border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-jm-text">
                            {app.worker.firstName} {app.worker.lastName}
                          </p>
                          <p className="text-sm text-jm-text-secondary mt-0.5">
                            {DEPARTMENT_LABELS[app.worker.department]} · {AVAILABILITY_LABELS[app.worker.availability]}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.worker.categories.map((c) => (
                              <Badge key={c.category.name} variant="cyan">
                                {c.category.name}
                              </Badge>
                            ))}
                          </div>
                          {app.worker.cvUrl && (
                            <a
                              href={app.worker.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-jm-cyan-light text-xs hover:underline mt-2 cursor-pointer"
                            >
                              <IconFileText size={13} />
                              Ver CV
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={app.status === "PENDING" ? "cyan" : app.status === "APPROVED" ? "green" : "red"}>
                            {app.status === "PENDING" && "Pendiente"}
                            {app.status === "APPROVED" && (activeTab === "INDICATED" ? "Aceptada por el trabajador" : "Aprobado")}
                            {app.status === "REJECTED" && (activeTab === "INDICATED" ? "Rechazada por el trabajador" : "Rechazado")}
                          </Badge>
                          {app.status === "PENDING" && activeTab === "SELF" && (
                            <div className="flex gap-2">
                              <Button variant="approve" onClick={() => updateApplicationStatus(app.id, "APPROVED")}>
                                Aprobar
                              </Button>
                              <Button variant="reject" onClick={() => updateApplicationStatus(app.id, "REJECTED")}>
                                Rechazar
                              </Button>
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
    </div>
  );
}