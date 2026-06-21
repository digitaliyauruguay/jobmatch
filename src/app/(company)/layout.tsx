/*
 * Archivo: src/app/(company)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas de la empresa.
 * Renderiza la navbar flotante una sola vez (con perfil, notificaciones
 * y salir) y envuelve el contenido de cada página, evitando duplicar
 * la navbar en cada página individual.
 */

import CompanyNavbar from "@/components/ui/CompanyNavbar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jm-black">
      <CompanyNavbar />
      {children}
    </div>
  );
}