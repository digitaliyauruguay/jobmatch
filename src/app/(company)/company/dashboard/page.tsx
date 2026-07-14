/*
 * Archivo: src/app/(company)/company/dashboard/page.tsx
 * Qué hace: Dashboard principal de la empresa con tema oscuro JobMatch.
 * Para ofertas ACTIVE muestra postulaciones recibidas e indicadas,
 * con acciones de aprobar/rechazar con feedback inline. Para ofertas
 * COMPLETED muestra la fecha de cierre y los trabajadores aprobados.
 * Para ofertas BLOCKED muestra el motivo. Las acciones sobre ofertas
 * (completar, eliminar) y postulaciones (aprobar, rechazar) muestran
 * feedback Procesando → éxito antes de recargar. La navbar la provee
 * el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  IconUsers, IconPlus, IconFileText, IconCalendar,
  IconUserCheck, IconAlertTriangle, IconCheck, IconLoader2,
} from "@tabler/icons-react";

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

type Observation = {
  id: string;
  message: string;
  createdAt: string;
  admin: { email: string };
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
  completedAt: string | null;
  category: { name: string };
  observations: Observation[];
};

type ActionState = { id: string; status: "loading" | "success"; label: string } | null;

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: "Presencial", REMOTE: "Remoto", HYBRID: "Híbrido",
};
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

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-UY", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function FeedbackChip({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
      state.status === "loading"
        ? "bg-jm-card-hover text-jm-text-secondary"
        : "bg-jm-green-bg text-jm-green-light"
    }`}>
      {state.status === "loading"
        ? <><IconLoader2 size={14} className="animate-spin" />Procesando...</>
        : <><IconCheck size={14} />{state.label}</>}
    </div>
  );
}

export default function CompanyDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [activeTab, setActiveTab] = useState<"SELF" | "INDICATED">("SELF");
  const [jobFilter, setJobFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED" | "DELETED" | "COMPLETED">("ACTIVE");
  const [jobActionState, setJobActionState] = useState<ActionState>(null);
  const [appActionState, setAppActionState] = useState<ActionState>(null);

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
    const job = jobs.find((j) => j.id === selectedJob);
    if (job?.status !== "ACTIVE") return;
    const appsInterval = setInterval(() => fetchApplications(selectedJob), 30000);
    return () => clearInterval(appsInterval);
  }, [selectedJob, jobs]);

  const handleSelectJob = (jobId: string, jobStatus: string) => {
    setSelectedJob(jobId);
    setAppActionState(null);
    if (jobStatus === "ACTIVE") fetchApplications(jobId);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta oferta? Esta acción no se puede deshacer.")) return;
    setJobActionState({ id: jobId, status: "loading", label: "" });
    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (res.ok) {
      setJobActionState({ id: jobId, status: "success", label: "Oferta eliminada" });
      setTimeout(async () => {
        setJobActionState(null);
        if (selectedJob === jobId) setSelectedJob(null);
        await fetchJobs();
      }, 1500);
    } else {
      setJobActionState(null);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm("¿Marcar esta oferta como completada?")) return;
    setJobActionState({ id: jobId, status: "loading", label: "" });
    const res = await fetch(`/api/jobs/${jobId}/complete`, { method: "PATCH" });
    if (res.ok) {
      setJobActionState({ id: jobId, status: "success", label: "Oferta completada" });
      setTimeout(async () => {
        setJobActionState(null);
        setJobFilter("COMPLETED");
        setSelectedJob(jobId); // ← mantener seleccionada
        await fetchJobs();
        fetchApplications(jobId); // ← cargar trabajadores contratados
      }, 1500);
    } else {
      setJobActionState(null);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    setAppActionState({ id: applicationId, status: "loading", label: "" });
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok && selectedJob) {
      const label = status === "APPROVED" ? "Postulación aprobada" : "Postulación rechazada";
      setAppActionState({ id: applicationId, status: "success", label });
      setTimeout(async () => {
        setAppActionState(null);
        await fetchApplications(selectedJob);
      }, 1500);
    } else {
      setAppActionState(null);
    }
  };

  const filteredApplications = applications.filter((a) => a.origin === activeTab);
  const selectedJobData = jobs.find((j) => j.id === selectedJob);
  const hiredWorkers = applications.filter((a) => a.status === "APPROVED");
  const visibleJobs = jobs.filter((j) => jobFilter === "ALL" || j.status === jobFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-6">
        <Link
          href="/company/workers"
          className="flex items-center justify-center gap-1.5 border border-jm-border-soft text-jm-text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:border-jm-gray transition-colors cursor-pointer"
        >
          <IconUsers size={16} />
          Buscar trabajadores
        </Link>
        <Link
          href="/company/jobs/new"
          className="flex items-center justify-center gap-1.5 bg-jm-magenta text-white px-4 py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
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
              <button key={s} onClick={() => setJobFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  jobFilter === s ? "bg-jm-magenta text-white" : "bg-jm-card text-jm-text-secondary border border-jm-border"
                }`}>
                {s === "ALL" && "Todas"}{s === "ACTIVE" && "Activas"}
                {s === "BLOCKED" && "Bloqueadas"}{s === "COMPLETED" && "Completadas"}{s === "DELETED" && "Eliminadas"}
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
                <div key={job.id} className="bg-jm-card rounded-lg p-4 transition-colors"
                  style={{ border: selectedJob === job.id ? "1px solid #993556" : "1px solid #232229" }}>
                  <button onClick={() => handleSelectJob(job.id, job.status)} className="text-left w-full cursor-pointer">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-sm text-jm-text">{job.title}</p>
                      {job.status !== "ACTIVE" && (
                        <Badge variant={job.status === "BLOCKED" ? "red" : job.status === "COMPLETED" ? "cyan" : "gray"}>
                          {job.status === "BLOCKED" && "Bloqueada"}
                          {job.status === "COMPLETED" && "Completada"}
                          {job.status === "DELETED" && "Eliminada"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-jm-text-secondary mt-1">{job.category.name} · {MODALITY_LABELS[job.modality]}</p>
                    <p className="text-xs text-jm-text-tertiary mt-1">{DEPARTMENT_LABELS[job.department]}</p>
                  </button>
                  {job.status === "ACTIVE" && (
                    <div className="flex gap-3 mt-3 flex-wrap items-center">
                      {jobActionState?.id === job.id ? (
                        <FeedbackChip state={jobActionState} />
                      ) : (
                        <>
                          <Link href={`/company/jobs/${job.id}/edit`} className="text-xs text-jm-cyan-light hover:underline cursor-pointer">
                            Editar
                          </Link>
                          <button
                            onClick={() => handleCompleteJob(job.id)}
                            disabled={!!jobActionState}
                            className="text-xs text-jm-green-light hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Marcar completada
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={!!jobActionState}
                            className="text-xs text-jm-red-light hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho — detalle */}
        <div className="md:col-span-2">
          {!selectedJob ? (
            <div className="bg-jm-card border border-jm-border rounded-lg p-8 text-center">
              <p className="text-jm-text-tertiary text-sm">Seleccioná una oferta para ver el detalle.</p>
            </div>
          ) : selectedJobData?.status === "COMPLETED" ? (
            <div className="bg-jm-card border border-jm-border rounded-2xl p-6">
              <h2 className="text-lg font-medium text-jm-text mb-4">{selectedJobData.title}</h2>
              {selectedJobData.completedAt && (
                <div className="flex items-center gap-2 text-jm-cyan-light text-sm mb-4">
                  <IconCalendar size={16} />
                  Completada el {formatDateTime(selectedJobData.completedAt)}
                </div>
              )}
              <p className="text-sm font-medium text-jm-text-secondary mb-2">Trabajadores contratados</p>
              {loadingApps ? (
                <p className="text-jm-text-tertiary text-sm">Cargando...</p>
              ) : hiredWorkers.length === 0 ? (
                <p className="text-jm-text-tertiary text-sm">No quedó registrado ningún trabajador con postulación aprobada en esta oferta.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {hiredWorkers.map((app) => (
                    <div key={app.id} className="flex items-center gap-2 bg-jm-green-bg border border-jm-green rounded-lg px-3 py-2">
                      <IconUserCheck size={16} className="text-jm-green-light" />
                      <span className="text-sm text-jm-text">{app.worker.firstName} {app.worker.lastName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedJobData?.status === "BLOCKED" ? (
            <div className="bg-jm-card border border-jm-red rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconAlertTriangle size={20} className="text-jm-red-light" />
                <h2 className="text-lg font-medium text-jm-text">{selectedJobData.title}</h2>
              </div>
              {selectedJobData.observations.length === 0 ? (
                <p className="text-jm-text-tertiary text-sm">No hay un motivo registrado para este bloqueo.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedJobData.observations.map((obs) => (
                    <div key={obs.id} className="bg-jm-red-bg border border-jm-red rounded-lg p-4">
                      <p className="text-sm text-jm-text mb-2">{obs.message}</p>
                      <p className="text-xs text-jm-text-tertiary">{formatDateTime(obs.createdAt)} · Bloqueada por el Administrador</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedJobData?.status === "DELETED" ? (
            <div className="bg-jm-card border border-jm-border rounded-lg p-8 text-center">
              <p className="text-jm-text-tertiary text-sm">Esta oferta fue eliminada y ya no está disponible.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-jm-text">{selectedJobData?.title}</h2>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <button onClick={() => setActiveTab("SELF")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "SELF" ? "bg-jm-magenta text-white" : "bg-jm-card text-jm-text-secondary border border-jm-border"
                  }`}>
                  Postulaciones recibidas
                </button>
                <button onClick={() => setActiveTab("INDICATED")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "INDICATED" ? "bg-jm-magenta text-white" : "bg-jm-card text-jm-text-secondary border border-jm-border"
                  }`}>
                  Indicados por mí
                </button>
              </div>

              {loadingApps ? (
                <p className="text-jm-text-tertiary text-sm">Cargando...</p>
              ) : filteredApplications.length === 0 ? (
                <div className="bg-jm-card border border-jm-border rounded-lg p-6 text-center">
                  <p className="text-jm-text-tertiary text-sm">
                    {activeTab === "SELF" ? "No hay postulaciones para esta oferta todavía." : "No indicaste trabajadores para esta oferta todavía."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="bg-jm-card border border-jm-border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div>
                          <p className="font-medium text-jm-text">{app.worker.firstName} {app.worker.lastName}</p>
                          <p className="text-sm text-jm-text-secondary mt-0.5">
                            {DEPARTMENT_LABELS[app.worker.department]} · {AVAILABILITY_LABELS[app.worker.availability]}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.worker.categories.map((c) => (
                              <Badge key={c.category.name} variant="cyan">{c.category.name}</Badge>
                            ))}
                          </div>
                          {app.worker.cvUrl && (
                            <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(app.worker.cvUrl)}&embedded=false`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-jm-cyan-light text-xs hover:underline mt-2 cursor-pointer">
                              <IconFileText size={13} />Ver CV
                            </a>
                          )}
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap">
                          <Badge variant={app.status === "PENDING" ? "cyan" : app.status === "APPROVED" ? "green" : "red"}>
                            {app.status === "PENDING" && "Pendiente"}
                            {app.status === "APPROVED" && (activeTab === "INDICATED" ? "Aceptada por el trabajador" : "Aprobado")}
                            {app.status === "REJECTED" && (activeTab === "INDICATED" ? "Rechazada por el trabajador" : "Rechazado")}
                          </Badge>
                          {app.status === "PENDING" && activeTab === "SELF" && (
                            appActionState?.id === app.id ? (
                              <FeedbackChip state={appActionState} />
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="approve" disabled={!!appActionState}
                                  onClick={() => updateApplicationStatus(app.id, "APPROVED")}>
                                  Aprobar
                                </Button>
                                <Button variant="reject" disabled={!!appActionState}
                                  onClick={() => updateApplicationStatus(app.id, "REJECTED")}>
                                  Rechazar
                                </Button>
                              </div>
                            )
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