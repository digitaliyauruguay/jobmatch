/*
 * Archivo: src/app/(public)/workers/page.tsx
 * Qué hace: Página pública de trabajadores disponibles. Muestra perfiles
 * básicos sin datos sensibles (sin teléfono, sin CV, sin apellido).
 * Cualquier intento de ver el perfil completo o contactar redirige
 * al registro o login.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Worker = {
  id: string;
  firstName: string;
  department: string;
  availability: string;
  description: string | null;
  categories: { category: { name: string } }[];
};

const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATE: "Disponible de inmediato",
  ONE_WEEK: "En una semana",
  TWO_WEEKS: "En dos semanas",
  ONE_MONTH: "En un mes",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  MONTEVIDEO: "Montevideo", CANELONES: "Canelones", MALDONADO: "Maldonado",
  ROCHA: "Rocha", TREINTA_Y_TRES: "Treinta y Tres", CERRO_LARGO: "Cerro Largo",
  RIVERA: "Rivera", ARTIGAS: "Artigas", SALTO: "Salto", PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro", SORIANO: "Soriano", COLONIA: "Colonia",
  SAN_JOSE: "San José", FLORES: "Flores", FLORIDA: "Florida",
  DURAZNO: "Durazno", TACUAREMBO: "Tacuarembó", LAVALLEJA: "Lavalleja",
};

export default function PublicWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workers")
      .then((r) => r.json())
      .then((data) => {
        setWorkers(data);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Trabajadores disponibles</h1>
          <p className="text-sm text-gray-500">{workers.length} trabajadores</p>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : workers.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay trabajadores disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{worker.firstName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {DEPARTMENT_LABELS[worker.department]}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {AVAILABILITY_LABELS[worker.availability]}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {worker.categories.map((c) => (
                      <span
                        key={c.category.name}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                  {worker.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {worker.description}
                    </p>
                  )}
                </div>
                <Link
                  href="/register"
                  className="mt-4 block w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Ver perfil completo
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}