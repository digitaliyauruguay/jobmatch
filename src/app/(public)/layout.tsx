/*
 * Archivo: src/app/(public)/layout.tsx
 * Qué hace: Layout compartido para las páginas públicas de la plataforma.
 * Accesible sin login. Muestra una barra de navegación con links
 * al login y registro para invitar a los visitantes a registrarse.
 */

import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-medium text-gray-900">
            JobMatch Uruguay
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">
              Ofertas
            </Link>
            <Link href="/workers" className="text-sm text-gray-600 hover:text-gray-900">
              Trabajadores
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
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
      {children}
    </>
  );
}