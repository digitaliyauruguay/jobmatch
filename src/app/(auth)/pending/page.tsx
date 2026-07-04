/*
 * Archivo: src/app/(auth)/pending/page.tsx
 * Qué hace: Página que ve el usuario después de registrarse.
 * Le informa que su cuenta está siendo revisada por el administrador
 * y que recibirá un email cuando sea aprobada.
 */

import { IconClock } from "@tabler/icons-react";

export default function PendingPage() {
  return (
    <main className="min-h-screen bg-jm-black flex items-center justify-center px-4">
      <div className="bg-jm-card border border-jm-border rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-jm-cyan-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <IconClock className="w-8 h-8 text-jm-cyan" />
        </div>
        <h1 className="text-2xl font-medium text-jm-text mb-2">
          ¡Cuenta creada!
        </h1>
        <p className="text-jm-text-secondary text-sm mb-6">
          Tu cuenta está siendo revisada por nuestro equipo. Te avisaremos por
          email cuando esté aprobada y puedas empezar a usar la plataforma.
        </p>
        <a
          href="/login"
          className="text-jm-cyan text-sm hover:text-jm-cyan-light hover:underline cursor-pointer transition-colors"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </main>
  );
}