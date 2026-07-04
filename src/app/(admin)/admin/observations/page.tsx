/*
 * Archivo: src/app/(admin)/admin/observations/page.tsx
 * Qué hace: Página del panel de administración que muestra el
 * historial de observaciones (bloqueos con motivo) realizadas sobre
 * usuarios u ofertas. Es de solo lectura: la creación de observaciones
 * ocurre desde /admin/users (bloquear/rechazar usuario) y desde
 * /admin/jobs (bloquear/eliminar oferta). Consume GET /api/admin/observations.
 * En mobile el listado se muestra como tarjetas apiladas en vez de tabla.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconArrowLeft } from "@tabler/icons-react";

type Observation = {
  id: string;
  message: string;
  targetType: "USER" | "JOB";
  createdAt: string;
  admin: {
    email: string;
  };
  targetUser?: {
    email: string;
    role: string;
    workerProfile?: { firstName: string; lastName: string } | null;
    companyProfile?: { name: string } | null;
  } | null;
  targetJob?: {
    title: string;
    company: { name: string };
  } | null;
};

export default function AdminObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [filter, setFilter] = useState<"ALL" | "USER" | "JOB">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObservations = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/observations");
      const data = await res.json();
      setObservations(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchObservations();
  }, []);

  const getTarget = (obs: Observation) => {
    if (obs.targetType === "USER" && obs.targetUser) {
      const name =
        obs.targetUser.workerProfile
          ? `${obs.targetUser.workerProfile.firstName} ${obs.targetUser.workerProfile.lastName}`
          : obs.targetUser.companyProfile?.name || obs.targetUser.email;
      return name;
    }
    if (obs.targetType === "JOB" && obs.targetJob) {
      return `${obs.targetJob.title} (${obs.targetJob.company.name})`;
    }
    return "Elemento eliminado";
  };

  const filtered = observations.filter((obs) =>
    filter === "ALL" ? true : obs.targetType === filter
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Historial de observaciones</h1>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "USER", "JOB"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === s
                ? "bg-jm-magenta text-white"
                : "bg-jm-card text-jm-text-secondary border border-jm-border"
            }`}
          >
            {s === "ALL" && "Todas"}
            {s === "USER" && "Usuarios"}
            {s === "JOB" && "Ofertas"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-jm-text-tertiary text-sm">No hay observaciones registradas.</p>
      ) : (
        <>
          {/* Vista tabla — desktop/tablet */}
          <div className="hidden md:block bg-jm-card border border-jm-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-jm-card-hover border-b border-jm-border">
                <tr>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Objetivo</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Motivo</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Admin</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jm-border">
                {filtered.map((obs) => (
                  <tr key={obs.id} className="hover:bg-jm-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={obs.targetType === "USER" ? "cyan" : "magenta"}>
                        {obs.targetType === "USER" ? "Usuario" : "Oferta"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-jm-text">{getTarget(obs)}</td>
                    <td className="px-4 py-3 text-jm-text-secondary max-w-md">{obs.message}</td>
                    <td className="px-4 py-3 text-jm-text-secondary">{obs.admin.email}</td>
                    <td className="px-4 py-3 text-jm-text-tertiary whitespace-nowrap">
                      {formatDate(obs.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista cards — mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((obs) => (
              <div key={obs.id} className="bg-jm-card border border-jm-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-jm-text">{getTarget(obs)}</h3>
                  <Badge variant={obs.targetType === "USER" ? "cyan" : "magenta"}>
                    {obs.targetType === "USER" ? "Usuario" : "Oferta"}
                  </Badge>
                </div>
                <p className="text-sm text-jm-text-secondary mb-2">{obs.message}</p>
                <div className="text-sm text-jm-text-tertiary space-y-1">
                  <p>
                    <span className="text-jm-text-tertiary">Admin: </span>
                    <span className="text-jm-text-secondary">{obs.admin.email}</span>
                  </p>
                  <p>{formatDate(obs.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}