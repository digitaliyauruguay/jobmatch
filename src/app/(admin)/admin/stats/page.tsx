/*
 * Archivo: src/app/(admin)/admin/stats/page.tsx
 * Qué hace: Panel de estadísticas para el administrador con tema
 * oscuro JobMatch. Muestra métricas de adopción, efectividad, demanda
 * y moderación. Soporta tres modos de visualización: todo el período
 * (default, sin filtro de fecha), un mes específico, o un rango
 * personalizado. Consume GET /api/admin/stats con startDate/endDate
 * opcionales. La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconUsers,
  IconBriefcase,
  IconTarget,
  IconClock,
  IconAlertTriangle,
} from "@tabler/icons-react";

type Stats = {
  period: { startDate: string | null; endDate: string | null };
  adoption: {
    usersByRoleStatus: { role: string; status: string; count: number }[];
    jobsByStatus: { status: string; count: number }[];
  };
  effectiveness: {
    workers: { active: number; withAtLeastOneHire: number; rate: number | null };
    companies: { active: number; withAtLeastOneHire: number; rate: number | null };
    applications: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      approvalRate: number | null;
      byOrigin: {
        SELF: { total: number; pending: number; approvalRate: number | null };
        INDICATED: { total: number; pending: number; approvalRate: number | null };
      };
    };
    avgHireTimeDays: number | null;
  };
  demand: {
    topCategories: { categoryId: string; name: string; count: number }[];
    jobsByDepartment: { department: string; count: number }[];
    jobsByModality: { modality: string; count: number }[];
    jobsByJobType: { jobType: string; count: number }[];
  };
  moderation: {
    observationsByTarget: { targetType: string; count: number }[];
  };
};

type Mode = "ALL" | "MONTH" | "CUSTOM";

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
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

const JOB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activas",
  BLOCKED: "Bloqueadas",
  DELETED: "Eliminadas",
  COMPLETED: "Completadas",
};

const USER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendientes",
  ACTIVE: "Activos",
  INACTIVE: "Inactivos",
  BLOCKED: "Bloqueados",
};

function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatDays(value: number | null) {
  if (value === null) return "—";
  if (value < 1) return "Menos de 1 día";
  return `${value.toFixed(1)} días`;
}

// Card de métrica simple, reutilizada en varias secciones
function MetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="bg-jm-card border border-jm-border rounded-lg p-4">
      <p className="text-xs text-jm-text-tertiary mb-1">{label}</p>
      <p className="text-2xl font-medium text-jm-text">{value}</p>
      {sublabel && <p className="text-xs text-jm-text-secondary mt-1">{sublabel}</p>}
    </div>
  );
}

// Barra de distribución simple (nombre + conteo + barra proporcional)
function DistributionBar({
  items,
  maxCount,
}: {
  items: { label: string; count: number }[];
  maxCount: number;
}) {
  if (items.length === 0) {
    return <p className="text-jm-text-tertiary text-sm">Sin datos en este período.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-jm-text">{item.label}</span>
            <span className="text-jm-text-secondary">{item.count}</span>
          </div>
          <div className="h-2 bg-jm-card-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-jm-cyan rounded-full"
              style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminStatsPage() {
  const [mode, setMode] = useState<Mode>("ALL");
  const [selectedMonth, setSelectedMonth] = useState(""); // YYYY-MM
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const buildRange = (): { startDate?: string; endDate?: string } => {
    if (mode === "ALL") return {};
    if (mode === "MONTH" && selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const start = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;
      return { startDate: start, endDate: end };
    }
    if (mode === "CUSTOM" && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return {};
  };

  const fetchStats = async () => {
    setLoading(true);
    const range = buildRange();
    const params = new URLSearchParams();
    if (range.startDate) params.set("startDate", range.startDate);
    if (range.endDate) params.set("endDate", range.endDate);

    const res = await fetch(`/api/admin/stats?${params.toString()}`);
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    if (mode === "ALL") fetchStats();
    if (mode === "MONTH" && selectedMonth) fetchStats();
    if (mode === "CUSTOM" && customStart && customEnd) fetchStats();
  }, [mode, selectedMonth, customStart, customEnd]);

  const usersByRole = (role: string) =>
    stats?.adoption.usersByRoleStatus.filter((u) => u.role === role) || [];

  const totalForRole = (role: string) =>
    usersByRole(role).reduce((sum, u) => sum + u.count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Estadísticas</h1>

      {/* Selector de modo */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "MONTH", "CUSTOM"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === m
                  ? "bg-jm-magenta text-white"
                  : "bg-jm-card text-jm-text-secondary border border-jm-border"
              }`}
            >
              {m === "ALL" && "Todo el período"}
              {m === "MONTH" && "Por mes"}
              {m === "CUSTOM" && "Rango personalizado"}
            </button>
          ))}
        </div>

        {mode === "MONTH" && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta max-w-xs"
          />
        )}

        {mode === "CUSTOM" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            />
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
            />
          </div>
        )}
      </div>

      {loading || !stats ? (
        <p className="text-jm-text-tertiary text-sm">Cargando estadísticas...</p>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Adopción */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <IconUsers size={18} className="text-jm-cyan-light" />
              <h2 className="text-lg font-medium text-jm-text">Adopción</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <MetricCard label="Trabajadores registrados" value={totalForRole("WORKER")} />
              <MetricCard label="Empresas registradas" value={totalForRole("COMPANY")} />
              <MetricCard
                label="Ofertas activas"
                value={
                  stats.adoption.jobsByStatus.find((j) => j.status === "ACTIVE")?.count || 0
                }
              />
              <MetricCard
                label="Ofertas completadas"
                value={
                  stats.adoption.jobsByStatus.find((j) => j.status === "COMPLETED")?.count || 0
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Usuarios por estado
                </p>
                <DistributionBar
                  items={Object.keys(USER_STATUS_LABELS).map((status) => ({
                    label: USER_STATUS_LABELS[status],
                    count: stats.adoption.usersByRoleStatus
                      .filter((u) => u.status === status)
                      .reduce((sum, u) => sum + u.count, 0),
                  }))}
                  maxCount={Math.max(
                    1,
                    ...Object.keys(USER_STATUS_LABELS).map((status) =>
                      stats.adoption.usersByRoleStatus
                        .filter((u) => u.status === status)
                        .reduce((sum, u) => sum + u.count, 0)
                    )
                  )}
                />
              </div>
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Ofertas por estado
                </p>
                <DistributionBar
                  items={stats.adoption.jobsByStatus.map((j) => ({
                    label: JOB_STATUS_LABELS[j.status] || j.status,
                    count: j.count,
                  }))}
                  maxCount={Math.max(1, ...stats.adoption.jobsByStatus.map((j) => j.count))}
                />
              </div>
            </div>
          </section>

          {/* Efectividad */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <IconTarget size={18} className="text-jm-green-light" />
              <h2 className="text-lg font-medium text-jm-text">Efectividad</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <MetricCard
                label="Trabajadores que consiguieron empleo"
                value={formatPercent(stats.effectiveness.workers.rate)}
                sublabel={`${stats.effectiveness.workers.withAtLeastOneHire} de ${stats.effectiveness.workers.active} activos`}
              />
              <MetricCard
                label="Empresas con contratación exitosa"
                value={formatPercent(stats.effectiveness.companies.rate)}
                sublabel={`${stats.effectiveness.companies.withAtLeastOneHire} de ${stats.effectiveness.companies.active} activas`}
              />
              <MetricCard
                label="Tasa de aprobación"
                value={formatPercent(stats.effectiveness.applications.approvalRate)}
                sublabel={`${stats.effectiveness.applications.approved} aprobadas, ${stats.effectiveness.applications.rejected} rechazadas`}
              />
              <MetricCard
                label="Tiempo promedio hasta contratación"
                value={formatDays(stats.effectiveness.avgHireTimeDays)}
              />
            </div>

            {stats.effectiveness.applications.pending > 0 && (
              <div className="bg-jm-cyan-bg border border-jm-cyan rounded-lg px-4 py-2.5 mb-4">
                <p className="text-sm text-jm-cyan-light">
                  {stats.effectiveness.applications.pending} postulaciones todavía están
                  pendientes de resolución en este período y no se incluyen en la tasa de
                  aprobación.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Postulaciones propias (SELF)
                </p>
                <p className="text-2xl font-medium text-jm-text mb-1">
                  {formatPercent(stats.effectiveness.applications.byOrigin.SELF.approvalRate)}
                </p>
                <p className="text-xs text-jm-text-tertiary">
                  {stats.effectiveness.applications.byOrigin.SELF.total} postulaciones ·{" "}
                  {stats.effectiveness.applications.byOrigin.SELF.pending} pendientes
                </p>
              </div>
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Indicaciones de empresas (INDICATED)
                </p>
                <p className="text-2xl font-medium text-jm-text mb-1">
                  {formatPercent(stats.effectiveness.applications.byOrigin.INDICATED.approvalRate)}
                </p>
                <p className="text-xs text-jm-text-tertiary">
                  {stats.effectiveness.applications.byOrigin.INDICATED.total} indicaciones ·{" "}
                  {stats.effectiveness.applications.byOrigin.INDICATED.pending} pendientes
                </p>
              </div>
            </div>
          </section>

          {/* Demanda */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <IconBriefcase size={18} className="text-jm-magenta-light" />
              <h2 className="text-lg font-medium text-jm-text">Demanda del mercado</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Categorías más demandadas
                </p>
                <DistributionBar
                  items={stats.demand.topCategories.slice(0, 8).map((c) => ({
                    label: c.name,
                    count: c.count,
                  }))}
                  maxCount={Math.max(1, ...stats.demand.topCategories.map((c) => c.count))}
                />
              </div>
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Departamentos con más ofertas
                </p>
                <DistributionBar
                  items={stats.demand.jobsByDepartment
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((d) => ({
                      label: DEPARTMENT_LABELS[d.department] || d.department,
                      count: d.count,
                    }))}
                  maxCount={Math.max(1, ...stats.demand.jobsByDepartment.map((d) => d.count))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Por modalidad
                </p>
                <DistributionBar
                  items={stats.demand.jobsByModality.map((m) => ({
                    label: MODALITY_LABELS[m.modality] || m.modality,
                    count: m.count,
                  }))}
                  maxCount={Math.max(1, ...stats.demand.jobsByModality.map((m) => m.count))}
                />
              </div>
              <div className="bg-jm-card border border-jm-border rounded-2xl p-5">
                <p className="text-sm font-medium text-jm-text-secondary mb-3">
                  Por tipo de trabajo
                </p>
                <DistributionBar
                  items={stats.demand.jobsByJobType.map((j) => ({
                    label: JOBTYPE_LABELS[j.jobType] || j.jobType,
                    count: j.count,
                  }))}
                  maxCount={Math.max(1, ...stats.demand.jobsByJobType.map((j) => j.count))}
                />
              </div>
            </div>
          </section>

          {/* Moderación */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <IconAlertTriangle size={18} className="text-jm-red-light" />
              <h2 className="text-lg font-medium text-jm-text">Moderación</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                label="Usuarios bloqueados con motivo"
                value={
                  stats.moderation.observationsByTarget.find((o) => o.targetType === "USER")
                    ?.count || 0
                }
              />
              <MetricCard
                label="Ofertas bloqueadas con motivo"
                value={
                  stats.moderation.observationsByTarget.find((o) => o.targetType === "JOB")
                    ?.count || 0
                }
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}