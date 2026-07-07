/*
 * Archivo: src/app/page.tsx
 * Qué hace: Página de inicio pública de JobMatch Uruguay con tema
 * oscuro. Usa PublicNavbar compartida con /jobs y /workers.
 * Hero dividido por audiencia (trabajador/empresa) con CTAs
 * diferenciados, seguido de una sección "Cómo funciona" en 3 pasos.
 */

import Link from "next/link";
import PublicNavbar from "@/components/ui/PublicNavbar";
import { IconUserCheck, IconBuildingStore, IconArrowRight } from "@tabler/icons-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-jm-black">
      <PublicNavbar />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <h1 className="text-4xl font-semibold text-jm-text mb-3">
          Encontrá tu próximo trabajo en Uruguay
        </h1>
        <p className="text-lg text-jm-text-secondary mb-10 max-w-xl mx-auto">
          Conectamos trabajadores con empresas de todo el país. Simple, rápido y gratuito.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
          <Link
            href="/register?role=worker"
            className="flex-1 bg-jm-card border border-jm-border rounded-2xl p-6 text-left hover:border-jm-cyan transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconUserCheck size={18} className="text-jm-cyan-light" />
              <p className="text-xs font-semibold text-jm-cyan-light tracking-wide">SOY TRABAJADOR</p>
            </div>
            <p className="text-sm text-jm-text-secondary mb-5">
              Buscá empleo y postulate a ofertas reales en tu departamento.
            </p>
            <span className="inline-flex items-center gap-1.5 bg-jm-magenta text-white text-sm font-medium px-4 py-2 rounded-lg shadow-[0_0_0_0_rgba(212,83,126,0)] group-hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] group-hover:bg-jm-magenta-light group-hover:text-jm-magenta-bg group-hover:scale-[1.02] transition-all duration-200">
              Empezar
              <IconArrowRight size={15} />
            </span>
          </Link>

          <Link
            href="/register?role=company"
            className="flex-1 bg-jm-card border border-jm-border rounded-2xl p-6 text-left hover:border-jm-magenta transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconBuildingStore size={18} className="text-jm-magenta-light" />
              <p className="text-xs font-semibold text-jm-magenta-light tracking-wide">SOY EMPRESA</p>
            </div>
            <p className="text-sm text-jm-text-secondary mb-5">
              Publicá ofertas y encontrá talento disponible para tu negocio.
            </p>
            <span className="inline-flex items-center gap-1.5 bg-transparent border border-jm-magenta text-jm-magenta-light text-sm font-medium px-4 py-2 rounded-lg group-hover:bg-jm-magenta-bg transition-colors duration-200">
              Empezar
              <IconArrowRight size={15} />
            </span>
          </Link>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="max-w-4xl mx-auto px-4 py-16 border-t border-jm-border">
        <p className="text-center text-xs font-semibold text-jm-text-tertiary tracking-widest mb-10">
          CÓMO FUNCIONA
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-jm-cyan-bg flex items-center justify-center mx-auto mb-3">
              <span className="text-jm-cyan-light text-sm font-semibold">1</span>
            </div>
            <p className="text-sm font-medium text-jm-text mb-1">Te registrás</p>
            <p className="text-xs text-jm-text-tertiary">Creás tu perfil en minutos</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-jm-cyan-bg flex items-center justify-center mx-auto mb-3">
              <span className="text-jm-cyan-light text-sm font-semibold">2</span>
            </div>
            <p className="text-sm font-medium text-jm-text mb-1">Buscás o publicás</p>
            <p className="text-xs text-jm-text-tertiary">Ofertas o trabajadores disponibles</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-jm-cyan-bg flex items-center justify-center mx-auto mb-3">
              <span className="text-jm-cyan-light text-sm font-semibold">3</span>
            </div>
            <p className="text-sm font-medium text-jm-text mb-1">Te conectás</p>
            <p className="text-xs text-jm-text-tertiary">Postulate o seleccioná directamente</p>
          </div>
        </div>
      </div>
    </main>
  );
}