/*
 * Archivo: src/components/ui/PublicNavbar.tsx
 * Qué hace: Navbar pública compartida entre la home, /jobs y /workers.
 * En desktop muestra los links y botones en línea. En mobile colapsa
 * a un menú hamburguesa que despliega un panel con todos los links.
 * Marca como activo el link de la página actual.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBriefcase,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
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

          {/* Links — visibles desde sm, ocultos en mobile */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/jobs"
              className={`text-sm transition-colors cursor-pointer ${
                isActive("/jobs") ? "text-jm-text" : "text-jm-text-secondary hover:text-jm-text"
              }`}
            >
              Ofertas
            </Link>
            <Link
              href="/workers"
              className={`text-sm transition-colors cursor-pointer ${
                isActive("/workers") ? "text-jm-text" : "text-jm-text-secondary hover:text-jm-text"
              }`}
            >
              Trabajadores
            </Link>
            <Link
              href="/login"
              className="bg-jm-cyan text-white px-4 py-2 rounded-lg text-sm font-medium shadow-[0_0_0_0_rgba(45,163,173,0)] hover:shadow-[0_0_20px_2px_rgba(45,163,173,0.45)] hover:bg-jm-cyan-light hover:text-jm-cyan-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
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

          {/* Botón hamburguesa — solo en mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer p-1"
            aria-label="Abrir menú"
          >
            {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
          </button>
        </div>

        {/* Panel desplegable — solo en mobile */}
        {menuOpen && (
          <div className="sm:hidden flex flex-col gap-1 px-5 pb-4 border-t border-jm-border pt-3">
            <Link
              href="/jobs"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer py-2"
            >
              Ofertas
            </Link>
            <Link
              href="/workers"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer py-2"
            >
              Trabajadores
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="bg-jm-cyan text-white px-4 py-2.5 rounded-lg text-sm font-medium text-center mt-1 cursor-pointer"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="bg-jm-magenta text-white px-4 py-2.5 rounded-lg text-sm font-medium text-center mt-1 cursor-pointer"
            >
              Registrarse
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}