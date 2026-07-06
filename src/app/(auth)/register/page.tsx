/*
 * Archivo: src/app/(auth)/register/page.tsx
 * Qué hace: Página de registro de nuevos usuarios con tema oscuro
 * JobMatch. Tres pasos: elegir rol, datos de acceso, perfil completo.
 * Validación campo por campo en orden, asteriscos en campos obligatorios,
 * honeypot anti-bot, sanitización de inputs y mensajes con ícono y
 * auto-dismiss de 4 segundos. Suspense por uso de useSearchParams.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FileUpload from "@/components/ui/FileUpload";
import {
  IconBriefcase, IconUserCheck, IconBuildingStore,
  IconArrowLeft, IconX, IconCheck,
} from "@tabler/icons-react";

type Category = { id: string; name: string };
type Message = { type: "error" | "success"; text: string } | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}$/;

const DEPARTMENTS = [
  "MONTEVIDEO","CANELONES","MALDONADO","ROCHA","TREINTA_Y_TRES",
  "CERRO_LARGO","RIVERA","ARTIGAS","SALTO","PAYSANDU","RIO_NEGRO",
  "SORIANO","COLONIA","SAN_JOSE","FLORES","FLORIDA","DURAZNO",
  "TACUAREMBO","LAVALLEJA",
];

const DEPARTMENT_LABELS: Record<string,string> = {
  MONTEVIDEO:"Montevideo",CANELONES:"Canelones",MALDONADO:"Maldonado",
  ROCHA:"Rocha",TREINTA_Y_TRES:"Treinta y Tres",CERRO_LARGO:"Cerro Largo",
  RIVERA:"Rivera",ARTIGAS:"Artigas",SALTO:"Salto",PAYSANDU:"Paysandú",
  RIO_NEGRO:"Río Negro",SORIANO:"Soriano",COLONIA:"Colonia",
  SAN_JOSE:"San José",FLORES:"Flores",FLORIDA:"Florida",
  DURAZNO:"Durazno",TACUAREMBO:"Tacuarembó",LAVALLEJA:"Lavalleja",
};

const AVAILABILITY_LABELS: Record<string,string> = {
  IMMEDIATE:"Disponible de inmediato",ONE_WEEK:"En una semana",
  TWO_WEEKS:"En dos semanas",ONE_MONTH:"En un mes",
};

// Label con asterisco para campos obligatorios
function RequiredLabel({ children }: { children: string }) {
  return (
    <label className="text-sm text-jm-text-secondary flex items-center gap-1">
      {children}
      <span className="text-jm-red-light">*</span>
    </label>
  );
}

function MessageBanner({ message }: { message: Message }) {
  if (!message) return null;
  return (
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
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"WORKER"|"COMPANY"|"">("");
  const [skippedStep1, setSkippedStep1] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");

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
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    const roleParam = searchParams.get("role");
    if (roleParam === "worker") { setRole("WORKER"); setStep(2); setSkippedStep1(true); }
    else if (roleParam === "company") { setRole("COMPANY"); setStep(2); setSkippedStep1(true); }
  }, [searchParams]);

  const showError = (text: string) => setMessage({ type: "error", text });
  const showSuccess = (text: string) => setMessage({ type: "success", text });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const validateStep2 = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { showError("El email es obligatorio."); return false; }
    if (!EMAIL_REGEX.test(trimmedEmail)) { showError("El email ingresado no tiene un formato válido."); return false; }
    if (!password) { showError("La contraseña es obligatoria."); return false; }
    if (password.length < 8) { showError("La contraseña debe tener al menos 8 caracteres."); return false; }

    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });
    const data = await res.json();
    if (data.exists) { showError("Ya existe una cuenta registrada con ese email."); return false; }

    setMessage(null);
    return true;
  };

  const validateStep3 = () => {
    if (role === "WORKER") {
      if (!firstName.trim()) { showError("El nombre es obligatorio."); return false; }
      if (firstName.trim().length < 2) { showError("El nombre debe tener al menos 2 caracteres."); return false; }
      if (!lastName.trim()) { showError("El apellido es obligatorio."); return false; }
      if (lastName.trim().length < 2) { showError("El apellido debe tener al menos 2 caracteres."); return false; }
      if (!phone.trim()) { showError("El teléfono es obligatorio."); return false; }
      if (!/^09[1-9]\d{6}$/.test(phone.trim())) { showError("El teléfono debe ser un número uruguayo válido (09XXXXXXX)."); return false; }
      if (!department) { showError("Seleccioná tu departamento."); return false; }
      if (!availability) { showError("Seleccioná tu disponibilidad."); return false; }
    }
    if (role === "COMPANY") {
      if (!companyName.trim()) { showError("El nombre de la empresa es obligatorio."); return false; }
      if (companyName.trim().length < 4) { showError("El nombre de la empresa debe tener al menos 4 caracteres."); return false; }
      if (!companyDepartment) { showError("Seleccioná el departamento de la empresa."); return false; }
      if (!contact.trim()) { showError("El teléfono es obligatorio."); return false; }
      if (!/^09[1-9]\d{6}$/.test(contact.trim())) { showError("El teléfono debe ser un número uruguayo válido (09XXXXXXX)."); return false; }
    }
    if (selectedCategories.length === 0) { showError("Seleccioná al menos una categoría."); return false; }
    setMessage(null);
    return true;
  };

  const handleRegister = async () => {
    // Si el honeypot tiene valor, es probable que sea un bot o autocompletado del navegador
    // Limpiar el honeypot y continuar — no bloqueamos silenciosamente
    if (honeypot) {
      setHoneypot("");
      return;
    }
    if (!validateStep3()) return;

    setLoading(true);
    setMessage(null);

    try {
      const profileData = role === "WORKER"
        ? {
            firstName: firstName.trim(), lastName: lastName.trim(),
            department, phone: phone.trim(), description: description.trim(),
            availability, photo: photo || null, cvUrl: cvUrl || null,
            categoryIds: selectedCategories,
          }
        : {
            name: companyName.trim(), department: companyDepartment,
            contact: contact.trim(), description: companyDescription.trim(),
            logo: logo || null, categoryIds: selectedCategories,
          };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role, profile: profileData }),
      });

      const data = await res.json();
      if (!res.ok) { showError(data.error || "Ocurrió un error al crear la cuenta. Intentá de nuevo."); setLoading(false); return; }

      showSuccess("¡Cuenta creada! Redirigiendo...");
      setTimeout(() => router.push("/pending"), 1000);
    } catch {
      showError("Ocurrió un error inesperado. Verificá tu conexión e intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-jm-black py-12 px-4">
      <div className="max-w-lg mx-auto">
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
          <h1 className="text-2xl font-medium text-jm-text mb-2">Crear cuenta</h1>
          <p className="text-jm-text-secondary text-sm mb-8">
            {step === 1 && "¿Cómo querés registrarte?"}
            {step === 2 && role === "WORKER" && "Datos de acceso — Trabajador"}
            {step === 2 && role === "COMPANY" && "Datos de acceso — Empresa"}
            {step === 3 && role === "WORKER" && "Tu perfil de trabajador"}
            {step === 3 && role === "COMPANY" && "Perfil de tu empresa"}
          </p>

          {/* Paso 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <button onClick={() => { setRole("WORKER"); setStep(2); }}
                className="border-2 border-jm-border rounded-xl p-6 text-left hover:border-jm-cyan transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-1">
                  <IconUserCheck size={18} className="text-jm-cyan-light" />
                  <p className="font-medium text-jm-text">Soy trabajador</p>
                </div>
                <p className="text-sm text-jm-text-secondary">Buscás empleo y querés postularte a ofertas</p>
              </button>
              <button onClick={() => { setRole("COMPANY"); setStep(2); }}
                className="border-2 border-jm-border rounded-xl p-6 text-left hover:border-jm-magenta transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-1">
                  <IconBuildingStore size={18} className="text-jm-magenta-light" />
                  <p className="font-medium text-jm-text">Soy empresa</p>
                </div>
                <p className="text-sm text-jm-text-secondary">Querés publicar ofertas y encontrar trabajadores</p>
              </button>
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Honeypot — nombre poco obvio para evitar autocompletado del navegador */}
              <div style={{ position:"absolute", left:"-9999px", top:"-9999px", opacity:0, pointerEvents:"none" }} aria-hidden="true">
                <input type="text" name="jm_url_field" value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="nope" />
              </div>

              <div className="flex flex-col gap-1">
                <RequiredLabel>Email</RequiredLabel>
                <input type="text" inputMode="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                  placeholder="tu@email.com" />
              </div>
              <div className="flex flex-col gap-1">
                <RequiredLabel>Contraseña</RequiredLabel>
                <input type="password" autoComplete="new-password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                  placeholder="Mínimo 8 caracteres" />
              </div>

              <MessageBanner message={message} />

              <div className="flex gap-2 mt-2">
                {!skippedStep1 && (
                  <button onClick={() => { setStep(1); setMessage(null); }}
                    className="flex-1 border border-jm-border text-jm-text-secondary rounded-lg py-2.5 text-sm hover:border-jm-gray transition-colors cursor-pointer">
                    Atrás
                  </button>
                )}
                <button onClick={async () => { if (await validateStep2()) setStep(3); }}
                  className="flex-1 bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  Continuar
                </button>
              </div>
              <p className="text-xs text-jm-text-tertiary"><span className="text-jm-red-light">*</span> Campo obligatorio</p>
            </div>
          )}

          {/* Paso 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              {role === "WORKER" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <RequiredLabel>Nombre</RequiredLabel>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <RequiredLabel>Apellido</RequiredLabel>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                        className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel>Teléfono</RequiredLabel>
                    <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                      placeholder="09XXXXXXX" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel>Departamento</RequiredLabel>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
                      <option value="">Seleccioná tu departamento</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel>Disponibilidad</RequiredLabel>
                    <select value={availability} onChange={(e) => setAvailability(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
                      <option value="">¿Cuándo podés empezar?</option>
                      {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Sobre vos <span className="text-jm-text-tertiary">(opcional)</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta resize-none"
                      rows={3} placeholder="Contanos algo sobre vos..." />
                  </div>
                  <FileUpload type="photo" label="Foto de perfil (opcional)" onUpload={(url) => setPhoto(url)} />
                  <FileUpload type="cv" label="CV en PDF (opcional)" onUpload={(url) => setCvUrl(url)} />
                </>
              )}

              {role === "COMPANY" && (
                <>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel>Nombre de la empresa</RequiredLabel>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel>Departamento</RequiredLabel>
                    <select value={companyDepartment} onChange={(e) => setCompanyDepartment(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta cursor-pointer">
                      <option value="">Seleccioná el departamento</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel>Teléfono</RequiredLabel>
                    <input type="tel" inputMode="numeric" value={contact} onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta"
                      placeholder="09XXXXXXX" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-jm-text-secondary">Descripción <span className="text-jm-text-tertiary">(opcional)</span></label>
                    <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)}
                      className="bg-jm-card-hover border border-jm-border rounded-lg px-4 py-2.5 text-sm text-jm-text focus:outline-none focus:border-jm-magenta resize-none"
                      rows={3} placeholder="Contanos sobre tu empresa..." />
                  </div>
                  <FileUpload type="logo" label="Logo de la empresa (opcional)" onUpload={(url) => setLogo(url)} />
                </>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm text-jm-text-secondary flex items-center gap-1">
                  {role === "WORKER" ? "¿En qué rubros podés trabajar?" : "¿En qué rubros opera tu empresa?"}
                  <span className="text-jm-red-light">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                        style={{ backgroundColor: isSelected ? "#993556" : "#1c1b22", color: isSelected ? "#ffffff" : "#84818f" }}
                        className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer">
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <MessageBanner message={message} />

              <div className="flex gap-2 mt-2">
                <button onClick={() => { setStep(2); setMessage(null); }}
                  className="flex-1 border border-jm-border text-jm-text-secondary rounded-lg py-2.5 text-sm hover:border-jm-gray transition-colors cursor-pointer">
                  Atrás
                </button>
                <button onClick={handleRegister} disabled={loading}
                  className="flex-1 bg-jm-magenta text-white rounded-lg py-2.5 text-sm font-medium shadow-[0_0_0_0_rgba(212,83,126,0)] hover:shadow-[0_0_20px_2px_rgba(212,83,126,0.45)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </div>
              <p className="text-xs text-jm-text-tertiary"><span className="text-jm-red-light">*</span> Campo obligatorio</p>
            </div>
          )}

          <p className="text-sm text-jm-text-tertiary mt-6 text-center">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-jm-cyan-light hover:underline cursor-pointer">Iniciá sesión</Link>
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