/*
 * Archivo: src/app/(admin)/admin/users/[id]/page.tsx
 * Qué hace: Vista de perfil individual de un trabajador o empresa
 * para el administrador. Recibe en la URL el ID del WorkerProfile o
 * CompanyProfile (no el del User) y prueba primero contra
 * /api/workers/[id]; si no encuentra, prueba /api/companies/[id].
 * Ambos endpoints permiten que el ADMIN vea el perfil sin importar
 * su estado (PENDING/ACTIVE/INACTIVE/BLOCKED). Es de solo lectura;
 * las acciones de aprobar/bloquear se hacen desde /admin/users.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconArrowLeft, IconFileText } from "@tabler/icons-react";

type Category = { category: { name: string } };

type WorkerProfileData = {
  kind: "worker";
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  department: string;
  phone: string;
  description?: string | null;
  availability: string;
  cvUrl?: string | null;
  categories: Category[];
  user: { status: string };
};

type CompanyProfileData = {
  kind: "company";
  id: string;
  name: string;
  logo?: string | null;
  department: string;
  contact: string;
  description?: string | null;
  categories: Category[];
  user: { status: string };
};

type ProfileData = WorkerProfileData | CompanyProfileData;

const availabilityLabel: Record<string, string> = {
  IMMEDIATE: "Inmediata",
  ONE_WEEK: "Una semana",
  TWO_WEEKS: "Dos semanas",
  ONE_MONTH: "Un mes",
};

const statusBadgeVariant: Record<string, "cyan" | "green" | "gray" | "red"> = {
  PENDING: "cyan",
  ACTIVE: "green",
  INACTIVE: "gray",
  BLOCKED: "red",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
};

export default function AdminUserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setNotFound(false);

      const workerRes = await fetch(`/api/workers/${id}`);
      if (workerRes.ok) {
        const data = await workerRes.json();
        setProfile({ ...data, kind: "worker" });
        setLoading(false);
        return;
      }

      const companyRes = await fetch(`/api/companies/${id}`);
      if (companyRes.ok) {
        const data = await companyRes.json();
        setProfile({ ...data, kind: "company" });
        setLoading(false);
        return;
      }

      setNotFound(true);
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      {loading ? (
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      ) : notFound || !profile ? (
        <p className="text-jm-text-tertiary text-sm">Perfil no encontrado.</p>
      ) : (
        <div className="bg-jm-card border border-jm-border rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-6">
            <div>
              <h1 className="text-xl font-medium text-jm-text">
                {profile.kind === "worker"
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.name}
              </h1>
              <p className="text-jm-text-secondary text-sm mt-1">
                {profile.kind === "worker" ? "Trabajador" : "Empresa"} · {profile.department}
              </p>
            </div>
            <div>
              <Badge variant={statusBadgeVariant[profile.user.status] || "gray"}>
                {statusLabel[profile.user.status] || profile.user.status}
              </Badge>
            </div>
          </div>

          {profile.description && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-jm-text-secondary mb-1">Descripción</h2>
              <p className="text-jm-text text-sm">{profile.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {profile.kind === "worker" && (
              <>
                <div>
                  <h2 className="text-sm font-medium text-jm-text-secondary mb-1">Teléfono</h2>
                  <p className="text-jm-text text-sm">{profile.phone}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-jm-text-secondary mb-1">Disponibilidad</h2>
                  <p className="text-jm-text text-sm">
                    {availabilityLabel[profile.availability] || profile.availability}
                  </p>
                </div>
              </>
            )}
            {profile.kind === "company" && (
              <div>
                <h2 className="text-sm font-medium text-jm-text-secondary mb-1">Contacto</h2>
                <p className="text-jm-text text-sm">{profile.contact}</p>
              </div>
            )}
          </div>

          {profile.categories.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-jm-text-secondary mb-2">Categorías</h2>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((c, i) => (
                  <Badge key={i} variant="cyan">
                    {c.category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.kind === "worker" && profile.cvUrl && (
            <div>
              <h2 className="text-sm font-medium text-jm-text-secondary mb-2">CV</h2>
              <a
                href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                  profile.cvUrl
                )}&embedded=false`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jm-card-hover border border-jm-border rounded-lg text-sm text-jm-text hover:border-jm-magenta transition-colors cursor-pointer"
              >
                <IconFileText size={16} />
                Abrir CV
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}