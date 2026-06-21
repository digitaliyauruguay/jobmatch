/*
 * Archivo: src/app/(admin)/admin/users/page.tsx
 * Qué hace: Página del panel de administración para gestionar usuarios
 * con tema oscuro JobMatch. Muestra la lista de usuarios filtrada por
 * estado (por defecto PENDING). El admin puede aprobar, rechazar,
 * desactivar o reactivar cuentas de trabajadores y empresas.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconArrowLeft } from "@tabler/icons-react";

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-1.5 text-sm text-jm-text-secondary hover:text-jm-text transition-colors cursor-pointer mb-6"
      >
        <IconArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-xl font-medium text-jm-text mb-6">Gestión de usuarios</h1>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {["PENDING", "ACTIVE", "INACTIVE", "BLOCKED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === s
                ? "bg-jm-magenta text-white"
                : "bg-jm-card text-jm-text-secondary border border-jm-border"
            }`}
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
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-jm-text-tertiary text-sm">No hay usuarios en este estado.</p>
      ) : (
        <div className="bg-jm-card border border-jm-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-jm-card-hover border-b border-jm-border">
              <tr>
                <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Email</th>
                <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Departamento</th>
                <th className="text-left px-4 py-3 text-jm-text-secondary font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jm-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-jm-card-hover transition-colors">
                  <td className="px-4 py-3 font-medium text-jm-text">{getName(user)}</td>
                  <td className="px-4 py-3 text-jm-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "WORKER" ? "cyan" : "magenta"}>
                      {user.role === "WORKER" ? "Trabajador" : "Empresa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-jm-text-secondary">{getDepartment(user)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {filter === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateStatus(user.id, "ACTIVE")}
                            className="px-3 py-1 bg-jm-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => updateStatus(user.id, "BLOCKED")}
                            className="px-3 py-1 bg-jm-red text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {filter === "ACTIVE" && (
                        <>
                          <button
                            onClick={() => updateStatus(user.id, "INACTIVE")}
                            className="px-3 py-1 bg-jm-gray text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Desactivar
                          </button>
                          <button
                            onClick={() => updateStatus(user.id, "BLOCKED")}
                            className="px-3 py-1 bg-jm-red text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Bloquear
                          </button>
                        </>
                      )}
                      {filter === "BLOCKED" && (
                        <button
                          onClick={() => updateStatus(user.id, "ACTIVE")}
                          className="px-3 py-1 bg-jm-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Desbloquear
                        </button>
                      )}
                      {filter === "INACTIVE" && (
                        <button
                          onClick={() => updateStatus(user.id, "ACTIVE")}
                          className="px-3 py-1 bg-jm-magenta text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
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
  );
}