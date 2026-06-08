/*
 * Archivo: src/app/(company)/company/workers/page.tsx
 * Qué hace: Página para que la empresa busque trabajadores disponibles
 * y los indique para una de sus ofertas publicadas. Muestra el perfil
 * básico de cada trabajador y permite seleccionar a cuál oferta indicarlo.
 * Al indicar se crea una postulación con origin INDICATED y se notifica
 * al trabajador por email y notificación interna.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

type Job = {
  id: string;
  title: string;
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

export default function CompanyWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicating, setIndicating] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Record<string, string>>({});
  const [indicated, setIndicated] = useState<string[]>([]);
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      const [workersRes, jobsRes] = await Promise.all([
        fetch("/api/workers"),
        fetch("/api/companies/me/jobs"),
      ]);
      const workersData = await workersRes.json();
      const jobsData = await jobsRes.json();
      setWorkers(workersData);
      setJobs(jobsData.filter((j: any) => j.status === "ACTIVE"));
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleIndicate = async (workerId: string) => {
    const jobId = selectedJob[workerId];
    if (!jobId) {
      setError({ ...error, [workerId]: "Seleccioná una oferta primero" });
      return;
    }

    setIndicating(workerId);
    setError({ ...error, [workerId]: "" });

    const res = await fetch("/api/applications/indicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, workerId }),
    });

    const data = await res.json();

    if (res.ok) {
      setIndicated((prev) => [...prev, `${workerId}-${jobId}`]);
    } else {
      setError({ ...error, [workerId]: data.error });
    }

    setIndicating(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/company/dashboard"
              className="text-gray-500 hover:text-gray-900 text-sm"
            >
              ← Volver
            </Link>
            <h1 className="text-xl font-medium">Buscar trabajadores</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {jobs.length === 0 && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              No tenés ofertas activas. Creá una oferta primero para poder indicar trabajadores.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando trabajadores...</p>
        ) : workers.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay trabajadores disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">
                      {worker.firstName} {worker.lastName}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {DEPARTMENT_LABELS[worker.department]}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {AVAILABILITY_LABELS[worker.availability]}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {worker.categories.map((c) => (
                        <span
                          key={c.category.name}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {c.category.name}
                        </span>
                      ))}
                    </div>
                    {worker.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {worker.description}
                      </p>
                    )}
                    {worker.cvUrl && (
                      <a
                        href={worker.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs hover:underline mt-2 inline-block"
                      >
                        Ver CV
                      </a>
                    )}
                  </div>
                </div>

                {jobs.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <select
                      value={selectedJob[worker.id] || ""}
                      onChange={(e) =>
                        setSelectedJob({ ...selectedJob, [worker.id]: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccioná una oferta</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>

                    {error[worker.id] && (
                      <p className="text-red-500 text-xs">{error[worker.id]}</p>
                    )}

                    <button
                      onClick={() => handleIndicate(worker.id)}
                      disabled={
                        indicating === worker.id ||
                        indicated.includes(`${worker.id}-${selectedJob[worker.id]}`)
                      }
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        indicated.includes(`${worker.id}-${selectedJob[worker.id]}`)
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } disabled:opacity-50`}
                    >
                      {indicating === worker.id
                        ? "Indicando..."
                        : indicated.includes(`${worker.id}-${selectedJob[worker.id]}`)
                        ? "Ya indicado"
                        : "Indicar para esta oferta"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}