/*
 * Archivo: src/components/ui/WorkerNavbar.tsx
 * Qué hace: Navbar flotante compartida para todas las páginas del
 * dashboard de trabajador. Muestra foto de perfil o avatar con
 * iniciales en magenta si no hay foto. Refresca la sesión cada
 * 15 segundos para detectar bloqueos/desactivaciones.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/ui/NotificationBell";
import { IconBriefcase, IconLogout } from "@tabler/icons-react";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function WorkerNavbar() {
  const { data: session, update } = useSession();
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

  useEffect(() => {
    const interval = setInterval(() => { update(); }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFocus = () => { update(); };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    if (session?.user?.status === "BLOCKED" || session?.user?.status === "INACTIVE") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.user?.status]);

  const displayName = profile?.firstName || "";
  const initials = displayName ? getInitials(displayName) : session?.user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-2 bg-jm-black">
      <nav className="max-w-7xl mx-auto bg-jm-card/90 backdrop-blur-md border border-jm-border rounded-2xl">
        <div className="px-5 py-3 flex justify-between items-center">
          <Link href="/worker/dashboard" className="flex items-center gap-2 cursor-pointer group">
            <IconBriefcase size={22}
              className="text-jm-magenta-light transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-6deg]" />
            <span className="text-lg font-medium text-jm-text transition-colors duration-200 group-hover:text-jm-magenta-light">
              JobMatch
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/worker/profile/edit" className="flex items-center gap-3 cursor-pointer group">
              {profile?.photo ? (
                <img src={profile.photo} alt="Foto de perfil"
                  className="w-8 h-8 rounded-full object-cover border border-jm-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-jm-magenta flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
              )}
              <span className="text-sm text-jm-text-secondary group-hover:text-jm-magenta-light transition-colors">
                {displayName}
              </span>
            </Link>
            <NotificationBell />
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-sm text-jm-text-tertiary hover:text-jm-text transition-colors cursor-pointer">
              <IconLogout size={16} />
              Salir
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}