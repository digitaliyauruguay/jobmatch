/*
 * Archivo: src/app/(auth)/login/page.tsx
 * Qué hace: Página de login con tema oscuro JobMatch. Muestra un
 * formulario con email y contraseña. Al enviar, usa NextAuth para
 * autenticar al usuario y lo redirige a su dashboard según su rol.
 * Validación propia sin depender del navegador (type="text" en email
 * para evitar tooltips nativos). Mensajes de error y éxito con ícono
 * que se auto-ocultan después de 4 segundos.
 */

"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBriefcase, IconArrowLeft, IconX, IconCheck } from "@tabler/icons-react";

type Message = { type: "error" | "success"; text: string } | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);

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

    if (!trimmedEmail) {
      showError("Ingresá tu email para continuar");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showError("El email ingresado no tiene un formato válido");
      return;
    }
    if (!password || password.length < 8) {
  showError("La contraseña debe tener al menos 8 caracteres");
  return;
}

    setLoading(true);
    setMessage(null);

    const result = await signIn("credentials", {
      email: trimmedEmail,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error.includes("PENDING")) {
        showError("Tu cuenta está pendiente de aprobación. Te avisaremos por email cuando esté lista");
      } else if (result.error.includes("BLOCKED")) {
        showError("Tu cuenta está bloqueada. Contactá al administrador para más información");
      } else if (result.error.includes("INACTIVE")) {
        showError("Tu cuenta está inactiva. Contactá al administrador para reactivarla");
      } else {
        showError("El email o la contraseña son incorrectos");
      }
      setLoading(false);
      return;
    }

    showSuccess("Ingreso exitoso. Redirigiendo...");

    const session = await fetch("/api/auth/session").then((r) => r.json());

    if (session?.user?.role === "WORKER") {
      router.push("/worker/dashboard");
    } else if (session?.user?.role === "COMPANY") {
      router.push("/company/dashboard");
    } else if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-jm-black px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 cursor-pointer group">
          <IconBriefcase
            size={26}
            className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]"
          />
          <span className="text-xl font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">
            JobMatch
          </span>
        </Link>

        <div className="flex justify-center mb-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-jm-magenta-light hover:text-jm-text transition-colors cursor-pointer"
          >
            <IconArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>

        <div className="bg-jm-card border border-jm-border rounded-2xl p-8">
          <h1 className="text-2xl font-medium text-jm-text mb-2">Iniciar sesión</h1>
          <p className="text-jm-text-secondary text-sm mb-6">
            Ingresá con tu cuenta para continuar
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-jm-text-secondary">Email</label>
              {/* type="text" para evitar el tooltip de validación nativo del navegador */}
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

            <div className="flex flex-col gap-1">
              <label className="text-sm text-jm-text-secondary">Contraseña</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                placeholder="••••••••"
              />
            </div>

            {/* Mensaje de error o éxito — aparece arriba del botón, desaparece en 4s */}
            {message && (
              <div
                className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  message.type === "error"
                    ? "bg-jm-red-bg border border-jm-red text-jm-red-light"
                    : "bg-jm-green-bg border border-jm-green text-jm-green-light"
                }`}
              >
                {message.type === "error" ? (
                  <IconX size={16} className="mt-0.5 flex-shrink-0" />
                ) : (
                  <IconCheck size={16} className="mt-0.5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <Link
              href="/forgot-password"
              className="text-sm text-jm-cyan-light hover:underline cursor-pointer text-center"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </form>

          <p className="text-sm text-jm-text-tertiary mt-6 text-center">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-jm-cyan-light hover:underline cursor-pointer">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}