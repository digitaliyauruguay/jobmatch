/*
 * Archivo: src/app/(public)/layout.tsx
 * Qué hace: Layout compartido para las páginas públicas de la plataforma
 * (/jobs y /workers). Accesible sin login. Navbar flotante con tema
 * oscuro JobMatch, logo animado y links a login/registro para invitar
 * a los visitantes a registrarse. Misma lógica funcional (layout estático),
 * solo cambia el theming visual.
 */

import Link from "next/link";
import { IconBriefcase } from "@tabler/icons-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jm-black">
      {/* Nav flotante */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-2 bg-jm-black">
        <nav className="max-w-7xl mx-auto bg-jm-card/90 backdrop-blur-md border border-jm-border rounded-2xl">
          <div className="px-5 py-3 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <IconBriefcase
                size={22}
                className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]"
              />
              <span className="text-lg font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">
                JobMatch
              </span>
            </Link>
            <div className="flex items-center gap-5">
              <Link
                href="/jobs"
                className="text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer"
              >
                Ofertas
              </Link>
              <Link
                href="/workers"
                className="text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer"
              >
                Trabajadores
              </Link>
              <Link
                href="/login"
                className="text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="bg-jm-magenta text-white px-4 py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </nav>
      </div>
      {children}
    </div>
  );
}