/*
 * Archivo: src/app/providers.tsx
 * Qué hace: Envuelve la aplicación con el SessionProvider de NextAuth,
 * que permite acceder a la sesión del usuario desde cualquier
 * componente del frontend sin tener que pasarla manualmente.
 */

"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}