/*
 * Archivo: src/components/ui/WorkerNavbar.tsx
 * Qué hace: Navbar flotante compartida para todas las páginas del
 * dashboard de trabajador. Hace su propio fetch del perfil (foto,
 * nombre) para mostrarlo de forma consistente en cualquier página,
 * junto con notificaciones y botón de salir. Refresca la sesión
 * cada 15 segundos para detectar bloqueos/desactivaciones y forzar
 * logout automático.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/ui/NotificationBell";
import { IconBriefcase, IconLogout } from "@tabler/icons-react";

export default function WorkerNavbar() {
  const { data: session, update } = useSession();

  // Refrescar sesión cada 15 segundos para detectar bloqueos/desactivaciones
  useEffect(() => {
    const interval = setInterval(() => { update(); }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Refrescar también al volver a la pestaña
  useEffect(() => {
    const handleFocus = () => { update(); };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  const [profile, setProfile] = useState<{ firstName: string; photo: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/workers/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // Detectar bloqueo/desactivación y forzar logout
  useEffect(() => {
    if (session?.user?.status === "BLOCKED" || session?.user?.status === "INACTIVE") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.user?.status]);

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-2 bg-jm-black">
      <nav className="max-w-7xl mx-auto bg-jm-card/90 backdrop-blur-md border border-jm-border rounded-2xl">
        <div className="px-5 py-3 flex justify-between items-center">
          <Link href="/worker/dashboard" className="flex items-center gap-2 cursor-pointer group">
            <IconBriefcase
              size={22}
              className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]"
            />
            <span className="text-lg font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">
              JobMatch
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/worker/profile/edit" className="flex items-center gap-3 cursor-pointer group">
              {profile?.photo ? (
                <img
                  src={profile.photo}
                  alt="Foto de perfil"
                  className="w-8 h-8 rounded-full object-cover border border-jm-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-jm-magenta flex items-center justify-center text-jm-magenta-light text-sm font-medium">
                  {profile?.firstName?.[0] || session?.user?.email?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-jm-text-secondary group-hover:text-jm-magenta-light transition-colors">
                {profile?.firstName || ""}
              </span>
            </Link>
            <NotificationBell />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-sm text-jm-text-tertiary hover:text-jm-text transition-colors cursor-pointer"
            >
              <IconLogout size={16} />
              Salir
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}