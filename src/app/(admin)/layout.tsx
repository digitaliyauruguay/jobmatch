/*
 * Archivo: src/app/(admin)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas del admin.
 * Por ahora simplemente renderiza el contenido sin agregar elementos extra.
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}