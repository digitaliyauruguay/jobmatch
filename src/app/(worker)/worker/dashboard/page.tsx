/*
 * Archivo: src/app/(worker)/worker/dashboard/page.tsx
 * Qué hace: Dashboard principal del trabajador con tema oscuro JobMatch.
 * Navbar flotante con logo placeholder, todos los elementos clickeables
 * muestran cursor pointer. Misma lógica funcional, solo cambia el
 * theming visual y la estructura de la navbar.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/ui/NotificationBell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  IconClock,
  IconCheck,
  IconX,
  IconBriefcase,
  IconLogout,
  IconFileText,
  IconExternalLink,
  IconDownload,
} from "@tabler/icons-react";

type Job = {
  id: string;
  title: string;
  description: string;
  modality: string;
  jobType: string;
  department: string;
  salary: string | null;
  createdAt: string;
  category: { name: string };
  company: { name: string; department: string };
};

type Application = {
  id: string;
  origin: string;
  status: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    modality: string;
    category: { name: string };
    company: { name: string };
  };
};

type Category = {
  id: string;
  name: string;
};

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: "Presencial",
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
};

const JOBTYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  TEMPORARY: "Temporal",
  PROJECT: "Por proyecto",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

export default function WorkerDashboard() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<"jobs" | "applications">("jobs");
  const [profile, setProfile] = useState<{ firstName: string; photo: string | null; cvUrl: string | null } | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({
    categoryId: "",
    department: "",
    modality: "",
    date: "",
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appTab, setAppTab] = useState<"SELF" | "INDICATED">("SELF");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const [applying, setApplying] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.department) params.append("department", filters.department);
    if (filters.modality) params.append("modality", filters.modality);
    if (filters.date) params.append("date", filters.date);

    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();
    setJobs(data);
    setLoadingJobs(false);
  };

  const fetchProfile = async () => {
    const res = await fetch("/api/workers/me");
    const data = await res.json();
    setProfile(data);
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    const res = await fetch("/api/applications/me");
    const data = await res.json();
    setApplications(data);
    setAppliedJobs(data.map((a: Application) => a.job.id));
    setLoadingApps(false);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchJobs();
    fetchApplications();
    fetchProfile();

    const jobsInterval = setInterval(fetchJobs, 30000);
    const appsInterval = setInterval(fetchApplications, 30000);

    return () => {
      clearInterval(jobsInterval);
      clearInterval(appsInterval);
    };
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  useEffect(() => {
    if (activeSection === "applications") {
      fetchApplications();
    }
  }, [activeSection]);

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });

    if (res.ok) {
      fetchApplications();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setApplying(null);
  };

  const handleRespondIndication = async (applicationId: string, status: string) => {
    setRespondingTo(applicationId);

    const res = await fetch(`/api/applications/${applicationId}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reason: status === "REJECTED" ? rejectReason[applicationId] : undefined,
      }),
    });

    if (res.ok) {
      fetchApplications();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setRespondingTo(null);
  };

  const filteredApplications = applications.filter((a) => a.origin === appTab);

  return (
    <main className="min-h-screen bg-jm-black">
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
                  {profile?.firstName || session?.user?.email}
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

      <div className="max-w-7xl mx-auto px-4 mt-6 mb-2">
        <div className="flex gap-6 border-b border-jm-border">
          <button
            onClick={() => setActiveSection("jobs")}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeSection === "jobs"
                ? "border-jm-magenta text-jm-magenta-light"
                : "border-transparent text-jm-text-tertiary hover:text-jm-text"
            }`}
          >
            Ofertas disponibles
          </button>
          <button
            onClick={() => setActiveSection("applications")}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeSection === "applications"
                ? "border-jm-magenta text-jm-magenta-light"
                : "border-transparent text-jm-text-tertiary hover:text-jm-text"
            }`}
          >
            Mis postulaciones
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === "jobs" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
              >
                <option value="">Todos los departamentos</option>
                {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                value={filters.modality}
                onChange={(e) => setFilters({ ...filters, modality: e.target.value })}
                className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
              >
                <option value="">Todas las modalidades</option>
                <option value="PRESENTIAL">Presencial</option>
                <option value="REMOTE">Remoto</option>
                <option value="HYBRID">Híbrido</option>
              </select>

              <select
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="bg-jm-card border border-jm-border rounded-lg px-3 py-2 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
              >
                <option value="">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>

            {loadingJobs ? (
              <p className="text-jm-text-tertiary text-sm">Cargando ofertas...</p>
            ) : jobs.length === 0 ? (
              <p className="text-jm-text-tertiary text-sm">No hay ofertas disponibles.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-jm-card border border-jm-border rounded-lg p-5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-jm-text">{job.title}</p>
                        <p className="text-sm text-jm-text-secondary mt-0.5">
                          {job.company.name} · {DEPARTMENT_LABELS[job.department]}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="cyan">{job.category.name}</Badge>
                          <Badge variant="gray">{MODALITY_LABELS[job.modality]}</Badge>
                          <Badge variant="gray">{JOBTYPE_LABELS[job.jobType]}</Badge>
                        </div>
                        {job.salary && (
                          <p className="text-sm text-jm-green-light mt-2">{job.salary}</p>
                        )}
                        <p className="text-sm text-jm-text-secondary mt-2 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        fullWidth
                        variant={appliedJobs.includes(job.id) ? "disabled" : "primary"}
                        disabled={applying === job.id || appliedJobs.includes(job.id)}
                        onClick={() => !appliedJobs.includes(job.id) && handleApply(job.id)}
                      >
                        {applying === job.id
                          ? "Postulando..."
                          : appliedJobs.includes(job.id)
                          ? "Ya postulado"
                          : "Postularme"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

         {activeSection === "applications" && profile?.cvUrl && (
          <div className="bg-jm-card border border-jm-border rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-jm-cyan-bg flex items-center justify-center">
                <IconFileText size={22} className="text-jm-cyan-light" />
              </div>
              <div>
                <p className="text-sm font-medium text-jm-text">Tu CV</p>
                <p className="text-xs text-jm-text-tertiary">Visible para las empresas a las que te postulás</p>
              </div>
            </div>
            <div className="flex gap-2">
              
              <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(profile.cvUrl)}&embedded=false`}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1.5 text-xs font-medium text-jm-cyan-light bg-jm-cyan-bg px-3 py-2 rounded-lg hover:bg-jm-cyan/20 transition-colors cursor-pointer"
>
  <IconExternalLink size={14} />
  Abrir
</a>

  <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(profile.cvUrl)}&embedded=false`}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1.5 text-xs font-medium text-jm-magenta-light bg-jm-magenta-bg px-3 py-2 rounded-lg hover:bg-jm-magenta/20 transition-colors cursor-pointer"
>
  <IconDownload size={14} />
  Descargar
</a>
            </div>
          </div>
        )}

        {activeSection === "applications" && (
          <>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAppTab("SELF")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  appTab === "SELF"
                    ? "bg-jm-magenta text-jm-magenta-light"
                    : "bg-jm-card text-jm-text-secondary border border-jm-border"
                }`}
              >
                Mis postulaciones
              </button>
              <button
                onClick={() => setAppTab("INDICATED")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  appTab === "INDICATED"
                    ? "bg-jm-magenta text-jm-magenta-light"
                    : "bg-jm-card text-jm-text-secondary border border-jm-border"
                }`}
              >
                Indicaciones recibidas
              </button>
            </div>

            {loadingApps ? (
              <p className="text-jm-text-tertiary text-sm">Cargando...</p>
            ) : filteredApplications.length === 0 ? (
              <p className="text-jm-text-tertiary text-sm">
                {appTab === "SELF"
                  ? "Todavía no te postulaste a ninguna oferta."
                  : "Todavía no recibiste indicaciones de empresas."}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-jm-card border border-jm-border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-jm-text">{app.job.title}</p>
                        <p className="text-sm text-jm-text-secondary mt-0.5">
                          {app.job.company.name} · {app.job.category.name}
                        </p>
                        <p className="text-xs text-jm-text-tertiary mt-1">
                          {MODALITY_LABELS[app.job.modality]}
                        </p>
                      </div>
                      <Badge
                        variant={
                          app.status === "PENDING" ? "cyan" : app.status === "APPROVED" ? "green" : "red"
                        }
                        icon={
                          app.status === "PENDING" ? (
                            <IconClock size={13} />
                          ) : app.status === "APPROVED" ? (
                            <IconCheck size={13} />
                          ) : (
                            <IconX size={13} />
                          )
                        }
                      >
                        {app.status === "PENDING" && "Pendiente"}
                        {app.status === "APPROVED" && (appTab === "INDICATED" ? "Aceptada" : "Aprobado")}
                        {app.status === "REJECTED" && (appTab === "INDICATED" ? "Rechazada" : "Rechazado")}
                      </Badge>
                    </div>

                    {appTab === "INDICATED" && app.status === "PENDING" && (
                      <div className="mt-3 pt-3 border-t border-jm-border flex flex-col gap-2">
                        <p className="text-xs text-jm-text-tertiary">¿Querés aceptar esta indicación?</p>
                        <input
                          type="text"
                          placeholder="Motivo si rechazás (opcional)"
                          value={rejectReason[app.id] || ""}
                          onChange={(e) => setRejectReason({ ...rejectReason, [app.id]: e.target.value })}
                          className="bg-jm-card-hover border border-jm-border rounded-lg px-3 py-1.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="approve"
                            icon={<IconCheck size={13} />}
                            disabled={respondingTo === app.id}
                            onClick={() => handleRespondIndication(app.id, "APPROVED")}
                          >
                            Aceptar
                          </Button>
                          <Button
                            variant="reject"
                            icon={<IconX size={13} />}
                            disabled={respondingTo === app.id}
                            onClick={() => handleRespondIndication(app.id, "REJECTED")}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}