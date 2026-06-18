/*
 * Archivo: src/app/(admin)/admin/users/page.tsx
 * Qué hace: Página del panel de administración para gestionar usuarios.
 * Muestra la lista de usuarios filtrada por estado (por defecto PENDING).
 * El admin puede aprobar, rechazar o bloquear cuentas de trabajadores
 * y empresas directamente desde esta página.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  workerProfile?: {
    firstName: string;
    lastName: string;
    department: string;
  };
  companyProfile?: {
    name: string;
    department: string;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (status: string) => {
  setLoading(true);
  const res = await fetch(`/api/admin/users?status=${status}`);
  const data = await res.json();
  setUsers(Array.isArray(data) ? data : []);
  setLoading(false);
};

  useEffect(() => {
    fetchUsers(filter);
  }, [filter]);

  const updateStatus = async (userId: string, status: string) => {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      fetchUsers(filter);
    }
  };

  const getName = (user: User) => {
    if (user.workerProfile) {
      return `${user.workerProfile.firstName} ${user.workerProfile.lastName}`;
    }
    if (user.companyProfile) {
      return user.companyProfile.name;
    }
    return "Sin perfil completado";
  };

  const getDepartment = (user: User) => {
    if (user.workerProfile) return user.workerProfile.department;
    if (user.companyProfile) return user.companyProfile.department;
    return "-";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">
              ← Volver
            </Link>
            <h1 className="text-xl font-medium">Gestión de usuarios</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {["PENDING", "ACTIVE", "INACTIVE", "BLOCKED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
  backgroundColor: filter === s ? "#2563eb" : "white",
  color: filter === s ? "white" : "#4b5563",
  border: filter === s ? "none" : "1px solid #e5e7eb",
}}
className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {s === "PENDING" && "Pendientes"}
              {s === "ACTIVE" && "Activos"}
              {s === "INACTIVE" && "Inactivos"}
              {s === "BLOCKED" && "Bloqueados"}
            </button>
          ))}
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay usuarios en este estado.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Rol</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Departamento</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{getName(user)}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
  style={{
    backgroundColor: user.role === "WORKER" ? "#eff6ff" : "#faf5ff",
    color: user.role === "WORKER" ? "#1d4ed8" : "#7e22ce",
  }}
  className="px-2 py-1 rounded-full text-xs font-medium"
>
                        {user.role === "WORKER" ? "Trabajador" : "Empresa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getDepartment(user)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {filter === "PENDING" && (
                          <>
                            <button
                              onClick={() => updateStatus(user.id, "ACTIVE")}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => updateStatus(user.id, "BLOCKED")}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {filter === "ACTIVE" && (
                          <button
                            onClick={() => updateStatus(user.id, "BLOCKED")}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                          >
                            Bloquear
                          </button>
                        )}
                        {filter === "BLOCKED" && (
                          <button
                            onClick={() => updateStatus(user.id, "ACTIVE")}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                          >
                            Desbloquear
                          </button>
                        )}
                        {filter === "INACTIVE" && (
                          <button
                            onClick={() => updateStatus(user.id, "ACTIVE")}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}