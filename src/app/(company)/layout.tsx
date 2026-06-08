/*
 * Archivo: src/app/(company)/layout.tsx
 * Qué hace: Layout compartido para todas las páginas de la empresa.
 * Por ahora simplemente renderiza el contenido sin agregar elementos extra.
 */

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}