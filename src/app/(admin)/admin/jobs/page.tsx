/*
 * Archivo: src/app/(admin)/admin/jobs/page.tsx
 * Qué hace: Página del panel de administración para gestionar ofertas
 * de trabajo con tema oscuro JobMatch. Muestra todas las ofertas
 * filtradas por estado. El admin puede bloquear, reactivar o eliminar
 * ofertas. Las acciones muestran feedback inline (Procesando → éxito)
 * antes de recargar la lista. En mobile usa tarjetas apiladas.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";

type Job = {
  id: string;
  title: string;
  status: string;
  modality: string;
  jobType: string;
  createdAt: string;
  category: { name: string };
  company: { name: string; department: string };
};

type ActionState = { jobId: string; status: "loading" | "success"; label: string } | null;

const ACTION_LABELS: Record<string, string> = {
  BLOCKED: "Oferta bloqueada",
  ACTIVE: "Oferta reactivada",
  DELETED: "Oferta eliminada",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [observationJobId, setObservationJobId] = useState<string | null>(null);
  const [observationMessage, setObservationMessage] = useState("");
  const [actionState, setActionState] = useState<ActionState>(null);

  const fetchJobs = async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/jobs?status=${status}`);
    const data = await res.json();
    setJobs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs(filter);
  }, [filter]);

  const updateStatus = async (jobId: string, status: string, message?: string) => {
    setActionState({ jobId, status: "loading", label: "" });

    const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message }),
    });

    if (res.ok) {
      setObservationJobId(null);
      setObservationMessage("");
      setActionState({ jobId, status: "success", label: ACTION_LABELS[status] || "Acción realizada" });
      setTimeout(async () => {
        setActionState(null);
        await fetchJobs(filter);
      }, 1500);
    } else {
      setActionState(null);
    }
  };

  const modalityLabel: Record<string, string> = {
    PRESENTIAL: "Presencial",
    REMOTE: "Remoto",
    HYBRID: "Híbrido",
  };

  const renderActions = (job: Job) => {
    if (actionState?.jobId === job.id) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
          actionState.status === "loading"
            ? "bg-jm-card-hover text-jm-text-secondary"
            : "bg-jm-green-bg text-jm-green-light"
        }`}>
          {actionState.status === "loading" ? (
            <><IconLoader2 size={14} className="animate-spin" />Procesando...</>
          ) : (
            <><IconCheck size={14} />{actionState.label}</>
          )}
        </div>
      );
    }

    return (
      <div className="flex gap-2 flex-wrap">
        {filter === "ACTIVE" && (
          <>
            <button
              onClick={() => setObservationJobId(job.id)}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-cyan text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bloquear
            </button>
            <button
              onClick={() => updateStatus(job.id, "DELETED")}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-red text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          </>
        )}
        {filter === "BLOCKED" && (
          <>
            <button
              onClick={() => updateStatus(job.id, "ACTIVE")}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reactivar
            </button>
            <button
              onClick={() => updateStatus(job.id, "DELETED")}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-red text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    );
  };

  const renderObservationInput = (job: Job) => (
    <div className="flex gap-2 items-center flex-wrap p-2 bg-jm-cyan-bg border-2 border-jm-cyan rounded-lg mt-2">
      <input
        type="text"
        value={observationMessage}
        onChange={(e) => setObservationMessage(e.target.value)}
        placeholder="Motivo del bloqueo (opcional)"
        className="flex-1 min-w-[160px] bg-jm-card border border-jm-border rounded-lg px-3 py-1.5 text-sm text-jm-text focus:outline-none focus:border-jm-cyan"
      />
      <button
        onClick={() => updateStatus(job.id, "BLOCKED", observationMessage)}
        className="px-3 py-1.5 bg-jm-cyan text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        Confirmar bloqueo
      </button>
      <button
        onClick={() => setObservationJobId(null)}
        className="px-3 py-1.5 bg-jm-card-hover text-jm-text-secondary rounded-lg text-sm hover:text-jm-text transition-colors cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Gestión de ofertas</h1>

      <div className="flex gap-2 mb-6">
        {["ACTIVE", "BLOCKED", "DELETED"].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setActionState(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === s
                ? "bg-jm-magenta text-white"
                : "bg-jm-card text-jm-text-secondary border border-jm-border"
            }`}
          >
            {s === "ACTIVE" && "Activas"}
            {s === "BLOCKED" && "Bloqueadas"}
            {s === "DELETED" && "Eliminadas"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      ) : jobs.length === 0 ? (
        <p className="text-jm-text-tertiary text-sm">No hay ofertas en este estado.</p>
      ) : (
        <>
          <div className="hidden md:block bg-jm-card border border-jm-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-jm-card-hover border-b border-jm-border">
                <tr>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Empresa</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Categoría</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Modalidad</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jm-border">
                {jobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr className="hover:bg-jm-card-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-jm-text">{job.title}</td>
                      <td className="px-4 py-3 text-jm-text-secondary">{job.company.name}</td>
                      <td className="px-4 py-3 text-jm-text-secondary">{job.category.name}</td>
                      <td className="px-4 py-3 text-jm-text-secondary">{modalityLabel[job.modality]}</td>
                      <td className="px-4 py-3">{renderActions(job)}</td>
                    </tr>
                    {observationJobId === job.id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3">{renderObservationInput(job)}</td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-jm-card border border-jm-border rounded-2xl p-4">
                <h3 className="font-medium text-jm-text mb-2">{job.title}</h3>
                <div className="text-sm text-jm-text-secondary space-y-1 mb-3">
                  <p><span className="text-jm-text-tertiary">Empresa: </span>{job.company.name}</p>
                  <p><span className="text-jm-text-tertiary">Categoría: </span>{job.category.name}</p>
                  <p><span className="text-jm-text-tertiary">Modalidad: </span>{modalityLabel[job.modality]}</p>
                </div>
                {renderActions(job)}
                {observationJobId === job.id && renderObservationInput(job)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}