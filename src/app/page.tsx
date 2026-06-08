/*
 * Archivo: src/app/page.tsx
 * Qué hace: Página de inicio pública de JobMatch Uruguay. Muestra
 * una landing page simple con el propósito de la plataforma y
 * botones para registrarse o ver las ofertas disponibles.
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-xl font-medium text-gray-900">
            JobMatch Uruguay
          </span>
          <div className="flex items-center gap-4">
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">
              Ofertas
            </Link>
            <Link href="/workers" className="text-sm text-gray-600 hover:text-gray-900">
              Trabajadores
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-medium text-gray-900 mb-4">
          Encontrá tu próximo trabajo en Uruguay
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Conectamos trabajadores con empresas de todo el país. Simple, rápido y gratuito.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/jobs"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Ver ofertas de trabajo
          </Link>
          <Link
            href="/register"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:border-gray-400 transition-colors"
          >
            Registrarse gratis
          </Link>
        </div>
      </div>
    </main>
  );
}