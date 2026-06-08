/*
 * Archivo: src/app/(worker)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas del trabajador.
 * Por ahora simplemente renderiza el contenido sin agregar elementos extra.
 */

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}