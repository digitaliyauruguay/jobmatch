/*
 * Archivo: src/app/(admin)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas del admin.
 * Renderiza la navbar flotante una sola vez (con email, notificaciones
 * y salir) y envuelve el contenido de cada página.
 */

import AdminNavbar from "@/components/ui/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jm-black">
      <AdminNavbar />
      {children}
    </div>
  );
}