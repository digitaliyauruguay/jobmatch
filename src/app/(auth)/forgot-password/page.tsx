/*
 * Archivo: src/app/(auth)/forgot-password/page.tsx
 * Qué hace: Página donde el usuario ingresa su email para recibir
 * un código de recuperación de contraseña. Tema oscuro JobMatch.
 * Validación propia sin tooltips del navegador, mensajes con ícono
 * y auto-dismiss de 4 segundos. Al enviar redirige a /reset-password.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBriefcase, IconArrowLeft, IconX, IconCheck } from "@tabler/icons-react";

type Message = { type: "error" | "success"; text: string } | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const showError = (text: string) => setMessage({ type: "error", text });
  const showSuccess = (text: string) => setMessage({ type: "success", text });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) { showError("Ingresá tu email para continuar."); return; }
    if (!EMAIL_REGEX.test(trimmedEmail)) { showError("El email ingresado no tiene un formato válido."); return; }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (res.ok) {
        showSuccess("Si el email existe, te enviamos un código. Redirigiendo...");
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(trimmedEmail)}`);
        }, 1500);
      } else {
        showError("Ocurrió un error al enviar el código. Intentá de nuevo.");
      }
    } catch {
      showError("Ocurrió un error inesperado. Verificá tu conexión e intentá de nuevo.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-jm-black px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 cursor-pointer group">
          <IconBriefcase size={26} className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]" />
          <span className="text-xl font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">JobMatch</span>
        </Link>

        <div className="flex justify-center mb-4">
          <Link href="/" className="flex items-center gap-1 text-sm text-jm-magenta-light hover:text-jm-text transition-colors cursor-pointer">
            <IconArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>

        <div className="bg-jm-card border border-jm-border rounded-2xl p-8">
          <h1 className="text-2xl font-medium text-jm-text mb-2">Recuperar contraseña</h1>
          <p className="text-jm-text-secondary text-sm mb-6">
            Ingresá tu email y te enviaremos un código para restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-jm-text-secondary">Email</label>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                placeholder="tu@email.com"
              />
            </div>

            {message && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                message.type === "error"
                  ? "bg-jm-red-bg border border-jm-red text-jm-red-light"
                  : "bg-jm-green-bg border border-jm-green text-jm-green-light"
              }`}>
                {message.type === "error"
                  ? <IconX size={16} className="mt-0.5 flex-shrink-0" />
                  : <IconCheck size={16} className="mt-0.5 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>

          <p className="text-sm text-jm-text-tertiary mt-6 text-center">
            <Link href="/login" className="text-jm-cyan-light hover:underline cursor-pointer">
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}