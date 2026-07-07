/*
 * Archivo: src/app/(public)/layout.tsx
 * Qué hace: Layout compartido para las páginas públicas (/jobs y /workers).
 * Usa PublicNavbar que incluye menú hamburguesa para mobile.
 * Las páginas individuales NO deben incluir su propio navbar.
 */

import PublicNavbar from "@/components/ui/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jm-black">
      <PublicNavbar />
      {children}
    </div>
  );
}