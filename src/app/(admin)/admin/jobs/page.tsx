/*
 * Archivo: src/app/(admin)/admin/jobs/page.tsx
 * Qué hace: Página del panel de administración para gestionar ofertas
 * de trabajo. Muestra todas las ofertas filtradas por estado.
 * El admin puede bloquear, reactivar o eliminar ofertas, y al
 * bloquearlas puede escribir un motivo que le llega a la empresa
 * como notificación.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [observationJobId, setObservationJobId] = useState<string | null>(null);
  const [observationMessage, setObservationMessage] = useState("");

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
    const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message }),
    });

    if (res.ok) {
      setObservationJobId(null);
      setObservationMessage("");
      fetchJobs(filter);
    }
  };

  const modalityLabel: Record<string, string> = {
    PRESENTIAL: "Presencial",
    REMOTE: "Remoto",
    HYBRID: "Híbrido",
  };

  const jobTypeLabel: Record<string, string> = {
    FULL_TIME: "Tiempo completo",
    PART_TIME: "Medio tiempo",
    TEMPORARY: "Temporal",
    PROJECT: "Por proyecto",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">
              ← Volver
            </Link>
            <h1 className="text-xl font-medium">Gestión de ofertas</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {["ACTIVE", "BLOCKED", "DELETED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
  backgroundColor: filter === s ? "#2563eb" : "white",
  color: filter === s ? "white" : "#4b5563",
  border: filter === s ? "none" : "1px solid #e5e7eb",
}}
className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {s === "ACTIVE" && "Activas"}
              {s === "BLOCKED" && "Bloqueadas"}
              {s === "DELETED" && "Eliminadas"}
            </button>
          ))}
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay ofertas en este estado.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Empresa</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Modalidad</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <>
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{job.title}</td>
                      <td className="px-4 py-3 text-gray-600">{job.company.name}</td>
                      <td className="px-4 py-3 text-gray-600">{job.category.name}</td>
                      <td className="px-4 py-3 text-gray-600">{modalityLabel[job.modality]}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {filter === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => setObservationJobId(job.id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition-colors"
                              >
                                Bloquear
                              </button>
                              <button
                                onClick={() => updateStatus(job.id, "DELETED")}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                          {filter === "BLOCKED" && (
                            <>
                              <button
                                onClick={() => updateStatus(job.id, "ACTIVE")}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                              >
                                Reactivar
                              </button>
                              <button
                                onClick={() => updateStatus(job.id, "DELETED")}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Panel de observación inline */}
                    {observationJobId === job.id && (
                      <tr key={`obs-${job.id}`} className="bg-yellow-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={observationMessage}
                              onChange={(e) => setObservationMessage(e.target.value)}
                              placeholder="Motivo del bloqueo (opcional)"
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-yellow-400"
                            />
                            <button
                              onClick={() => updateStatus(job.id, "BLOCKED", observationMessage)}
                              className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                            >
                              Confirmar bloqueo
                            </button>
                            <button
                              onClick={() => setObservationJobId(null)}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}