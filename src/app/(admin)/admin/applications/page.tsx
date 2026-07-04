/*
 * Archivo: src/app/(admin)/admin/applications/page.tsx
 * Qué hace: Página del panel de administración que muestra todas las
 * postulaciones de la plataforma, con filtros por estado (PENDING/
 * APPROVED/REJECTED) y por origen (SELF/INDICATED). Es de solo lectura:
 * el cambio de estado de una postulación lo gestionan worker/empresa
 * desde sus propios flujos. Consume GET /api/admin/applications. En
 * mobile el listado se muestra como tarjetas apiladas en vez de tabla.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconArrowLeft } from "@tabler/icons-react";

type Application = {
  id: string;
  origin: "SELF" | "INDICATED";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  worker: {
    firstName: string;
    lastName: string;
    department: string;
  };
  job: {
    title: string;
    company: { name: string };
  };
};

const statusLabel: Record<Application["status"], string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const statusBadgeVariant: Record<Application["status"], "cyan" | "green" | "red"> = {
  PENDING: "cyan",
  APPROVED: "green",
  REJECTED: "red",
};

const originLabel: Record<Application["origin"], string> = {
  SELF: "Postulación propia",
  INDICATED: "Indicada por empresa",
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Application["status"]>("ALL");
  const [originFilter, setOriginFilter] = useState<"ALL" | Application["origin"]>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchApplications = async (status: string, origin: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (origin !== "ALL") params.set("origin", origin);

    const res = await fetch(`/api/admin/applications?${params.toString()}`);
    const data = await res.json();
    setApplications(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications(statusFilter, originFilter);
  }, [statusFilter, originFilter]);

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

      <h1 className="text-xl font-medium text-jm-text mb-6">Postulaciones</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === s
                  ? "bg-jm-magenta text-white"
                  : "bg-jm-card text-jm-text-secondary border border-jm-border"
              }`}
            >
              {s === "ALL" && "Todos los estados"}
              {s !== "ALL" && statusLabel[s]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["ALL", "SELF", "INDICATED"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOriginFilter(o)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                originFilter === o
                  ? "bg-jm-cyan text-white"
                  : "bg-jm-card text-jm-text-secondary border border-jm-border"
              }`}
            >
              {o === "ALL" && "Todos los orígenes"}
              {o !== "ALL" && originLabel[o]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      ) : applications.length === 0 ? (
        <p className="text-jm-text-tertiary text-sm">No hay postulaciones con estos filtros.</p>
      ) : (
        <>
          {/* Vista tabla — desktop/tablet */}
          <div className="hidden md:block bg-jm-card border border-jm-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-jm-card-hover border-b border-jm-border">
                <tr>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Trabajador</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Oferta</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Empresa</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Origen</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jm-border">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-jm-card-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-jm-text">
                      {app.worker.firstName} {app.worker.lastName}
                    </td>
                    <td className="px-4 py-3 text-jm-text-secondary">{app.job.title}</td>
                    <td className="px-4 py-3 text-jm-text-secondary">{app.job.company.name}</td>
                    <td className="px-4 py-3 text-jm-text-secondary">{originLabel[app.origin]}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant[app.status]}>
                        {statusLabel[app.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-jm-text-tertiary whitespace-nowrap">
                      {formatDate(app.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista cards — mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {applications.map((app) => (
              <div key={app.id} className="bg-jm-card border border-jm-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-jm-text">
                    {app.worker.firstName} {app.worker.lastName}
                  </h3>
                  <Badge variant={statusBadgeVariant[app.status]}>{statusLabel[app.status]}</Badge>
                </div>
                <div className="text-sm text-jm-text-secondary space-y-1">
                  <p>
                    <span className="text-jm-text-tertiary">Oferta: </span>
                    {app.job.title}
                  </p>
                  <p>
                    <span className="text-jm-text-tertiary">Empresa: </span>
                    {app.job.company.name}
                  </p>
                  <p>
                    <span className="text-jm-text-tertiary">Origen: </span>
                    {originLabel[app.origin]}
                  </p>
                  <p>
                    <span className="text-jm-text-tertiary">Fecha: </span>
                    {formatDate(app.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}