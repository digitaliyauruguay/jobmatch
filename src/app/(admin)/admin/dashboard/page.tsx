/*
 * Archivo: src/app/(admin)/dashboard/page.tsx
 * Qué hace: Dashboard del administrador. Es la página principal
 * a la que llega el admin después de loguear. Desde aquí puede
 * navegar a aprobar usuarios, gestionar ofertas, y moderar
 * la plataforma.
 */

"use client";

import NotificationBell from "@/components/ui/NotificationBell";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium">JobMatch Admin</h1>
          <div className="flex items-center gap-4">
  <span className="text-sm text-gray-600">{session?.user?.email}</span>
  <NotificationBell />
</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-medium mb-6">Panel de administración</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta de usuarios pendientes */}
          <Link href="/admin/users">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Usuarios pendientes</h3>
              <p className="text-gray-600 text-sm">
                Aprobar o rechazar nuevas cuentas de trabajadores y empresas
              </p>
            </div>
          </Link>

          {/* Tarjeta de ofertas */}
          <Link href="/admin/jobs">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Gestionar ofertas</h3>
              <p className="text-gray-600 text-sm">
                Ver, bloquear o eliminar ofertas de trabajo
              </p>
            </div>
          </Link>

          {/* Tarjeta de postulaciones */}
          <Link href="/admin/applications">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Postulaciones</h3>
              <p className="text-gray-600 text-sm">
                Ver todas las postulaciones en la plataforma
              </p>
            </div>
          </Link>

          {/* Tarjeta de observaciones */}
          <Link href="/admin/observations">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Observaciones</h3>
              <p className="text-gray-600 text-sm">
                Hacer observaciones a perfiles u ofertas
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}