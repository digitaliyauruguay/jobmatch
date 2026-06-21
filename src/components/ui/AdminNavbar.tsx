/*
 * Archivo: src/components/ui/AdminNavbar.tsx
 * Qué hace: Navbar flotante compartida para todas las páginas del
 * panel de administración. Muestra el email del admin, notificaciones
 * y botón de salir. Se usa desde el layout de (admin) para no duplicar
 * esta lógica en cada página individual.
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/ui/NotificationBell";
import { IconBriefcase, IconLogout } from "@tabler/icons-react";

export default function AdminNavbar() {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-2 bg-jm-black">
      <nav className="max-w-7xl mx-auto bg-jm-card/90 backdrop-blur-md border border-jm-border rounded-2xl">
        <div className="px-5 py-3 flex justify-between items-center">
          <Link href="/admin/dashboard" className="flex items-center gap-2 cursor-pointer group">
            <IconBriefcase
              size={22}
              className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]"
            />
            <span className="text-lg font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">
              JobMatch Admin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-jm-text-secondary">{session?.user?.email}</span>
            <NotificationBell />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-sm text-jm-text-tertiary hover:text-jm-text transition-colors cursor-pointer"
            >
              <IconLogout size={16} />
              Salir
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}