/*
 * Archivo: src/app/(auth)/login/page.tsx
 * Qué hace: Página de login con tema oscuro JobMatch. Muestra un
 * formulario con email y contraseña. Al enviar, usa NextAuth para
 * autenticar al usuario y lo redirige a su dashboard según su rol.
 * Si el usuario está pendiente de aprobación o bloqueado, muestra
 * un mensaje de error correspondiente.
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBriefcase } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error.includes("PENDING")) {
        setError("Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté lista.");
      } else if (result.error.includes("BLOCKED")) {
        setError("Tu cuenta está bloqueada. Contactá al administrador.");
      } else if (result.error.includes("INACTIVE")) {
        setError("Tu cuenta está inactiva. Contactá al administrador.");
      } else {
        setError("Email o contraseña incorrectos.");
      }
      setLoading(false);
      return;
    }

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
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer group">
          <IconBriefcase
            size={26}
            className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]"
          />
          <span className="text-xl font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">
            JobMatch
          </span>
        </Link>

        <div className="bg-jm-card border border-jm-border rounded-2xl p-8">
          <h1 className="text-2xl font-medium text-jm-text mb-2">
            Iniciar sesión
          </h1>
          <p className="text-jm-text-secondary text-sm mb-6">
            Ingresá con tu cuenta para continuar
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-jm-text-secondary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-jm-text-secondary">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-jm-red-light text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
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