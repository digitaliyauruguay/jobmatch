/*
 * Archivo: src/app/layout.tsx
 * Qué hace: Layout raíz de la aplicación. Envuelve todas las páginas
 * con el provider de NextAuth para que la sesión esté disponible
 * en toda la app, y define los metadatos globales.
 */

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "./providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobMatch Uruguay",
  description: "Conectamos trabajadores con empresas en Uruguay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

