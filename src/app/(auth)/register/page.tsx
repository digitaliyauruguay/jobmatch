/*
 * Archivo: src/app/(auth)/register/page.tsx
 * Qué hace: Página de registro de nuevos usuarios con tema oscuro
 * JobMatch. Permite registrarse como trabajador o empresa en tres
 * pasos. Si llega con ?role=worker o ?role=company en la URL (desde
 * la home), salta directo al paso 2 con el rol ya preseleccionado,
 * sin mostrar de nuevo la pregunta de "¿cómo querés registrarte?".
 * El usuario y el perfil se crean en un único paso al final, evitando
 * usuarios sin perfil en caso de error. Queda en estado PENDING
 * esperando aprobación del administrador. Envuelto en Suspense porque
 * usa useSearchParams, requerido por Next.js para el build estático.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FileUpload from "@/components/ui/FileUpload";
import { IconBriefcase, IconUserCheck, IconBuildingStore } from "@tabler/icons-react";

type Category = {
  id: string;
  name: string;
};

const DEPARTMENTS = [
  "MONTEVIDEO", "CANELONES", "MALDONADO", "ROCHA", "TREINTA_Y_TRES",
  "CERRO_LARGO", "RIVERA", "ARTIGAS", "SALTO", "PAYSANDU", "RIO_NEGRO",
  "SORIANO", "COLONIA", "SAN_JOSE", "FLORES", "FLORIDA", "DURAZNO",
  "TACUAREMBO", "LAVALLEJA",
];

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATE: "Disponible de inmediato",
  ONE_WEEK: "En una semana",
  TWO_WEEKS: "En dos semanas",
  ONE_MONTH: "En un mes",
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"WORKER" | "COMPANY" | "">("");
  const [skippedStep1, setSkippedStep1] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("");
  const [photo, setPhoto] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyDepartment, setCompanyDepartment] = useState("");
  const [contact, setContact] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);

    const roleParam = searchParams.get("role");
    if (roleParam === "worker") {
      setRole("WORKER");
      setStep(2);
      setSkippedStep1(true);
    } else if (roleParam === "company") {
      setRole("COMPANY");
      setStep(2);
      setSkippedStep1(true);
    }
  }, [searchParams]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const validateStep2 = async () => {
    if (!email || !password) {
      setError("Completá todos los campos");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Ingresá un email válido");
      return false;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (data.exists) {
      setError("Ya existe una cuenta con ese email");
      return false;
    }

    setError("");
    return true;
  };

  const validateStep3 = () => {
    if (selectedCategories.length === 0) {
      setError("Seleccioná al menos una categoría");
      return false;
    }
    if (role === "WORKER") {
      if (!firstName || !lastName || !department || !phone || !availability) {
        setError("Completá todos los campos obligatorios");
        return false;
      }
    }
    if (role === "COMPANY") {
      if (!companyName || !companyDepartment || !contact) {
        setError("Completá todos los campos obligatorios");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setError("");

    try {
      const profileData =
        role === "WORKER"
          ? {
              firstName,
              lastName,
              department,
              phone,
              description,
              availability,
              photo: photo || null,
              cvUrl: cvUrl || null,
              categoryIds: selectedCategories,
            }
          : {
              name: companyName,
              department: companyDepartment,
              contact,
              description: companyDescription,
              logo: logo || null,
              categoryIds: selectedCategories,
            };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, profile: profileData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/pending");
    } catch {
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-jm-black py-12 px-4">
      <div className="max-w-lg mx-auto">
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
          <h1 className="text-2xl font-medium text-jm-text mb-2">Crear cuenta</h1>
          <p className="text-jm-text-secondary text-sm mb-8">
            {step === 1 && "¿Cómo querés registrarte?"}
            {step === 2 && role === "WORKER" && "Datos de acceso — Trabajador"}
            {step === 2 && role === "COMPANY" && "Datos de acceso — Empresa"}
            {step === 3 && role === "WORKER" && "Tu perfil de trabajador"}
            {step === 3 && role === "COMPANY" && "Perfil de tu empresa"}
          </p>

          {/* Paso 1 — elegir rol */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setRole("WORKER"); setStep(2); }}
                className="border-2 border-jm-border rounded-xl p-6 text-left hover:border-jm-cyan transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconUserCheck size={18} className="text-jm-cyan-light" />
                  <p className="font-medium text-jm-text">Soy trabajador</p>
                </div>
                <p className="text-sm text-jm-text-secondary">
                  Buscás empleo y querés postularte a ofertas
                </p>
              </button>
              <button
                onClick={() => { setRole("COMPANY"); setStep(2); }}
                className="border-2 border-jm-border rounded-xl p-6 text-left hover:border-jm-magenta transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconBuildingStore size={18} className="text-jm-magenta-light" />
                  <p className="font-medium text-jm-text">Soy empresa</p>
                </div>
                <p className="text-sm text-jm-text-secondary">
                  Querés publicar ofertas y encontrar trabajadores
                </p>
              </button>
            </div>
          )}

          {/* Paso 2 — email y contraseña */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-jm-text-secondary">Email</label>
                <input
                  type="email"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              {error && <p className="text-jm-red-light text-sm">{error}</p>}
              <div className="flex gap-2 mt-2">
                {!skippedStep1 && (
                  <button
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex-1 border border-jm-border text-jm-text-secondary rounded-lg py-2.5 text-sm hover:border-jm-gray transition-colors cursor-pointer"
                  >
                    Atrás
                  </button>
                )}
                <button
                  onClick={async () => { if (await validateStep2()) setStep(3); }}
                  className="flex-1 bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Paso 3 — perfil */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              {role === "WORKER" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-jm-text-secondary">Nombre</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-jm-text-secondary">Apellido</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Teléfono</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                      placeholder="09X XXX XXX"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Departamento</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
                    >
                      <option value="">Seleccioná tu departamento</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Disponibilidad</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
                    >
                      <option value="">¿Cuándo podés empezar?</option>
                      {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Sobre vos (opcional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta resize-none"
                      rows={3}
                      placeholder="Contanos algo sobre vos..."
                    />
                  </div>
                  <FileUpload
                    type="photo"
                    label="Foto de perfil (opcional)"
                    onUpload={(url) => setPhoto(url)}
                  />
                  <FileUpload
                    type="cv"
                    label="CV en PDF (opcional)"
                    onUpload={(url) => setCvUrl(url)}
                  />
                </>
              )}

              {role === "COMPANY" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Nombre de la empresa</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Departamento</label>
                    <select
                      value={companyDepartment}
                      onChange={(e) => setCompanyDepartment(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer"
                    >
                      <option value="">Seleccioná el departamento</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Contacto</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                      placeholder="Teléfono o email de contacto"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Descripción (opcional)</label>
                    <textarea
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta resize-none"
                      rows={3}
                      placeholder="Contanos sobre tu empresa..."
                    />
                  </div>
                  <FileUpload
                    type="logo"
                    label="Logo de la empresa (opcional)"
                    onUpload={(url) => setLogo(url)}
                  />
                </>
              )}

              {/* Categorías */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-jm-text-secondary">
                  {role === "WORKER"
                    ? "¿En qué rubros podés trabajar?"
                    : "¿En qué rubros opera tu empresa?"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        style={{
                          backgroundColor: isSelected ? "#993556" : "#1c1b22",
                          color: isSelected ? "#ffffff" : "#84818f",
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-jm-red-light text-sm">{error}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setStep(2); setError(""); }}
                  className="flex-1 border border-jm-border text-jm-text-secondary rounded-lg py-2.5 text-sm hover:border-jm-gray transition-colors cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </div>
            </div>
          )}

          <p className="text-sm text-jm-text-tertiary mt-6 text-center">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-jm-cyan-light hover:underline cursor-pointer">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-jm-black flex items-center justify-center">
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      </main>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}