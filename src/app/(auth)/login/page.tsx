/*
 * Archivo: src/app/(auth)/login/page.tsx
 * Qué hace: Página de login de la aplicación. Muestra un formulario
 * con email y contraseña. Al enviar, usa NextAuth para autenticar
 * al usuario y lo redirige a su dashboard según su rol.
 * Si el usuario está pendiente de aprobación o bloqueado, muestra
 * un mensaje de error correspondiente.
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          Iniciar sesión
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Ingresá con tu cuenta para continuar
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          ¿No tenés cuenta?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Registrate
          </a>
        </p>
      </div>
    </main>
  );
}