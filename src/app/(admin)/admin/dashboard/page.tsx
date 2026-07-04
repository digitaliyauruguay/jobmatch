/*
 * Archivo: src/app/(admin)/admin/dashboard/page.tsx
 * Qué hace: Dashboard del administrador con tema oscuro JobMatch.
 * Es la página principal a la que llega el admin después de loguear.
 * Desde aquí puede navegar a aprobar usuarios, gestionar ofertas,
 * moderar la plataforma y ver estadísticas. La navbar la provee el
 * layout compartido.
 */

"use client";

import Link from "next/link";
import {
  IconUserCheck,
  IconBriefcase,
  IconClipboardList,
  IconMessageExclamation,
  IconChartBar,
} from "@tabler/icons-react";

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium text-jm-text mb-6">Panel de administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/users"
          className="bg-jm-card border border-jm-border p-6 rounded-2xl hover:border-jm-magenta transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <IconUserCheck size={20} className="text-jm-cyan-light" />
            <h2 className="text-lg font-medium text-jm-text">Usuarios pendientes</h2>
          </div>
          <p className="text-jm-text-secondary text-sm">
            Aprobar o rechazar nuevas cuentas de trabajadores y empresas
          </p>
        </Link>

        <Link
          href="/admin/jobs"
          className="bg-jm-card border border-jm-border p-6 rounded-2xl hover:border-jm-magenta transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <IconBriefcase size={20} className="text-jm-cyan-light" />
            <h2 className="text-lg font-medium text-jm-text">Gestionar ofertas</h2>
          </div>
          <p className="text-jm-text-secondary text-sm">
            Ver, bloquear o eliminar ofertas de trabajo
          </p>
        </Link>

        <Link
          href="/admin/applications"
          className="bg-jm-card border border-jm-border p-6 rounded-2xl hover:border-jm-magenta transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <IconClipboardList size={20} className="text-jm-cyan-light" />
            <h2 className="text-lg font-medium text-jm-text">Postulaciones</h2>
          </div>
          <p className="text-jm-text-secondary text-sm">
            Ver todas las postulaciones en la plataforma
          </p>
        </Link>

        <Link
          href="/admin/observations"
          className="bg-jm-card border border-jm-border p-6 rounded-2xl hover:border-jm-magenta transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <IconMessageExclamation size={20} className="text-jm-cyan-light" />
            <h2 className="text-lg font-medium text-jm-text">Observaciones</h2>
          </div>
          <p className="text-jm-text-secondary text-sm">
            Ver el historial de bloqueos y motivos registrados
          </p>
        </Link>

        <Link
          href="/admin/stats"
          className="bg-jm-card border border-jm-border p-6 rounded-2xl hover:border-jm-magenta transition-colors cursor-pointer md:col-span-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <IconChartBar size={20} className="text-jm-cyan-light" />
            <h2 className="text-lg font-medium text-jm-text">Estadísticas</h2>
          </div>
          <p className="text-jm-text-secondary text-sm">
            Adopción, efectividad, demanda y moderación de la plataforma
          </p>
        </Link>
      </div>
    </div>
  );
}