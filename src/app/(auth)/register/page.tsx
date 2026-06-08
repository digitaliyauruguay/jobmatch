/*
 * Archivo: src/app/(auth)/register/page.tsx
 * Qué hace: Página de registro de nuevos usuarios. Permite registrarse
 * como trabajador o como empresa en tres pasos. El usuario y el perfil
 * se crean en un único paso al final, evitando usuarios sin perfil
 * en caso de error. Al completar queda en estado PENDING esperando
 * aprobación del administrador.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"WORKER" | "COMPANY" | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Datos comunes
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Datos trabajador
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("");

  // Datos empresa
  const [companyName, setCompanyName] = useState("");
  const [companyDepartment, setCompanyDepartment] = useState("");
  const [contact, setContact] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const validateStep2 = () => {
    if (!email || !password) {
      setError("Completá todos los campos");
      return false;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
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
            categoryIds: selectedCategories,
          }
        : {
            name: companyName,
            department: companyDepartment,
            contact,
            description: companyDescription,
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

    // Redirigir a página de espera de aprobación
    router.push("/pending");
  } catch {
    setError("Ocurrió un error inesperado. Intentá de nuevo.");
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mb-8">
            {step === 1 && "¿Cómo querés registrarte?"}
            {step === 2 && "Datos de acceso"}
            {step === 3 && role === "WORKER" && "Tu perfil de trabajador"}
            {step === 3 && role === "COMPANY" && "Perfil de tu empresa"}
          </p>

          {/* Paso 1 — elegir rol */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setRole("WORKER"); setStep(2); }}
                className="border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 transition-colors"
              >
                <p className="font-medium text-gray-900">Soy trabajador</p>
                <p className="text-sm text-gray-500 mt-1">
                  Buscás empleo y querés postularte a ofertas
                </p>
              </button>
              <button
                onClick={() => { setRole("COMPANY"); setStep(2); }}
                className="border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 transition-colors"
              >
                <p className="font-medium text-gray-900">Soy empresa</p>
                <p className="text-sm text-gray-500 mt-1">
                  Querés publicar ofertas y encontrar trabajadores
                </p>
              </button>
            </div>
          )}

          {/* Paso 2 — email y contraseña */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:border-gray-400 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => { if (validateStep2()) setStep(3); }}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
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
                      <label className="text-sm text-gray-700">Nombre</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-700">Apellido</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Teléfono</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="09X XXX XXX"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Departamento</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccioná tu departamento</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Disponibilidad</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">¿Cuándo podés empezar?</option>
                      {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Sobre vos (opcional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Contanos algo sobre vos..."
                    />
                  </div>
                </>
              )}

              {role === "COMPANY" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Nombre de la empresa</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Departamento</label>
                    <select
                      value={companyDepartment}
                      onChange={(e) => setCompanyDepartment(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccioná el departamento</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Contacto</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Teléfono o email de contacto"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-700">Descripción (opcional)</label>
                    <textarea
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Contanos sobre tu empresa..."
                    />
                  </div>
                </>
              )}

              {/* Categorías */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700">
                  {role === "WORKER"
                    ? "¿En qué rubros podés trabajar?"
                    : "¿En qué rubros opera tu empresa?"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedCategories.includes(cat.id)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setStep(2); setError(""); }}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:border-gray-400 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-6 text-center">
            ¿Ya tenés cuenta?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Iniciá sesión
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}