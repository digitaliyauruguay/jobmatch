/*
 * Archivo: src/app/(worker)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas del trabajador.
 * Renderiza la navbar flotante una sola vez (con perfil, notificaciones
 * y salir) y envuelve el contenido de cada página, evitando duplicar
 * la navbar en cada página individual.
 */

import WorkerNavbar from "@/components/ui/WorkerNavbar";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jm-black">
      <WorkerNavbar />
      {children}
    </div>
  );
}