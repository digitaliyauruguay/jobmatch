/*
 * Archivo: src/app/(worker)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas del trabajador.
 * Renderiza la navbar flotante una sola vez (con perfil, notificaciones
 * y salir) y envuelve el contenido de cada página, evitando duplicar
 * la navbar en cada página individual. También monta el asistente de
 * IA (botón flotante), visible solo para trabajadores logueados ya que
 * esta ruta está protegida por middleware.ts.
 */

import WorkerNavbar from "@/components/ui/WorkerNavbar";
import ChatbotWidget from "@/components/ui/ChatbotWidget";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jm-black">
      <WorkerNavbar />
      {children}
      <ChatbotWidget />
    </div>
  );
}