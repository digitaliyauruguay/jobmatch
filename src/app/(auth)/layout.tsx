/*
 * Archivo: src/app/(auth)/layout.tsx
 * Qué hace: Layout compartido para las páginas de autenticación
 * (login y registro). Por ahora simplemente renderiza el contenido
 * de cada página sin agregar elementos extra.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}