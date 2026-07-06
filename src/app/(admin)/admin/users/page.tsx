/*
 * Archivo: src/app/(admin)/admin/users/page.tsx
 * Qué hace: Página del panel de administración para gestionar usuarios
 * con tema oscuro JobMatch. Muestra la lista de usuarios filtrada por
 * estado (por defecto PENDING). El admin puede aprobar, rechazar,
 * desactivar, bloquear o reactivar cuentas de trabajadores y empresas.
 * Rechazar (desde PENDING) y Bloquear (desde ACTIVE) abren un input de
 * motivo opcional: si se confirma, se crea una Observation vía
 * /api/admin/observations (que además bloquea al usuario y lo notifica).
 * Las demás transiciones muestran un modal de cargando → éxito antes
 * de recargar la lista. En mobile el listado se muestra como tarjetas.
 * La navbar la provee el layout compartido.
 */

"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";

type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  workerProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
  };
  companyProfile?: {
    id: string;
    name: string;
    department: string;
  };
};

type ActionState = { userId: string; status: "loading" | "success"; label: string } | null;

const ACTION_LABELS: Record<string, string> = {
  ACTIVE: "Acción realizada correctamente",
  INACTIVE: "Acción realizada correctamente",
  BLOCKED: "Acción realizada correctamente",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [observationUserId, setObservationUserId] = useState<string | null>(null);
  const [observationMessage, setObservationMessage] = useState("");
  const [actionState, setActionState] = useState<ActionState>(null);

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

  // Transiciones simples con modal de feedback
  const updateStatus = async (userId: string, status: string) => {
    setActionState({ userId, status: "loading", label: "" });

    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setActionState({ userId, status: "success", label: ACTION_LABELS[status] || "Acción realizada" });
      setTimeout(async () => {
        setActionState(null);
        await fetchUsers(filter);
      }, 1500);
    } else {
      setActionState(null);
    }
  };

  // Bloquear/rechazar con motivo
  const blockWithObservation = async (userId: string, message: string) => {
    setActionState({ userId, status: "loading", label: "" });

    const res = await fetch(`/api/admin/observations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim() || "Sin motivo especificado",
        targetType: "USER",
        targetUserId: userId,
      }),
    });

    if (res.ok) {
      setObservationUserId(null);
      setObservationMessage("");
      setActionState({
        userId,
        status: "success",
        label: filter === "PENDING" ? "Cuenta rechazada" : "Cuenta bloqueada",
      });
      setTimeout(async () => {
        setActionState(null);
        await fetchUsers(filter);
      }, 1500);
    } else {
      setActionState(null);
    }
  };

  const getName = (user: User) => {
    if (user.workerProfile) return `${user.workerProfile.firstName} ${user.workerProfile.lastName}`;
    if (user.companyProfile) return user.companyProfile.name;
    return "Sin perfil completado";
  };

  const getProfileId = (user: User) => user.workerProfile?.id || user.companyProfile?.id || null;

  const getDepartment = (user: User) => {
    if (user.workerProfile) return user.workerProfile.department;
    if (user.companyProfile) return user.companyProfile.department;
    return "-";
  };

  const renderName = (user: User) => {
    const profileId = getProfileId(user);
    if (profileId) {
      return (
        <Link
          href={`/admin/users/${profileId}`}
          className="text-jm-text hover:text-jm-magenta-light hover:underline cursor-pointer transition-colors"
        >
          {getName(user)}
        </Link>
      );
    }
    return <span className="text-jm-text">{getName(user)}</span>;
  };

  const renderActions = (user: User) => {
    // Si hay una acción en curso para este usuario, mostrar feedback inline
    if (actionState?.userId === user.id) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
          actionState.status === "loading"
            ? "bg-jm-card-hover text-jm-text-secondary"
            : "bg-jm-green-bg text-jm-green-light"
        }`}>
          {actionState.status === "loading" ? (
            <>
              <IconLoader2 size={14} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <IconCheck size={14} />
              {actionState.label}
            </>
          )}
        </div>
      );
    }

    return (
      <div className="flex gap-2 flex-wrap">
        {filter === "PENDING" && (
          <>
            <button
              onClick={() => updateStatus(user.id, "ACTIVE")}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aprobar
            </button>
            <button
              onClick={() => setObservationUserId(user.id)}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-red text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rechazar
            </button>
          </>
        )}
        {filter === "ACTIVE" && (
          <>
            <button
              onClick={() => updateStatus(user.id, "INACTIVE")}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-gray text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Desactivar
            </button>
            <button
              onClick={() => setObservationUserId(user.id)}
              disabled={!!actionState}
              className="px-3 py-1 bg-jm-red text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bloquear
            </button>
          </>
        )}
        {filter === "BLOCKED" && (
          <button
            onClick={() => updateStatus(user.id, "ACTIVE")}
            disabled={!!actionState}
            className="px-3 py-1 bg-jm-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Desbloquear
          </button>
        )}
        {filter === "INACTIVE" && (
          <button
            onClick={() => updateStatus(user.id, "ACTIVE")}
            disabled={!!actionState}
            className="px-3 py-1 bg-jm-magenta text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reactivar
          </button>
        )}
      </div>
    );
  };

  const renderObservationInput = (user: User) => (
    <div className="flex gap-2 items-center flex-wrap p-2 bg-jm-red-bg border-2 border-jm-red rounded-lg mt-2">
      <input
        type="text"
        value={observationMessage}
        onChange={(e) => setObservationMessage(e.target.value)}
        placeholder={
          filter === "PENDING" ? "Motivo del rechazo (opcional)" : "Motivo del bloqueo (opcional)"
        }
        className="flex-1 min-w-[160px] bg-jm-card border border-jm-border rounded-lg px-3 py-1.5 text-sm text-jm-text focus:outline-none focus:border-jm-red"
      />
      <button
        onClick={() => blockWithObservation(user.id, observationMessage)}
        className="px-3 py-1.5 bg-jm-red text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        {filter === "PENDING" ? "Confirmar rechazo" : "Confirmar bloqueo"}
      </button>
      <button
        onClick={() => { setObservationUserId(null); setObservationMessage(""); }}
        className="px-3 py-1.5 bg-jm-card-hover text-jm-text-secondary rounded-lg text-sm hover:text-jm-text transition-colors cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );

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
            onClick={() => {
              setFilter(s);
              setObservationUserId(null);
              setObservationMessage("");
              setActionState(null);
            }}
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

      {loading ? (
        <p className="text-jm-text-tertiary text-sm">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-jm-text-tertiary text-sm">No hay usuarios en este estado.</p>
      ) : (
        <>
          {/* Vista tabla — desktop/tablet */}
          <div className="hidden md:block bg-jm-card border border-jm-border rounded-2xl overflow-hidden">
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
                  <Fragment key={user.id}>
                    <tr className="hover:bg-jm-card-hover transition-colors">
                      <td className="px-4 py-3 font-medium">{renderName(user)}</td>
                      <td className="px-4 py-3 text-jm-text-secondary">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === "WORKER" ? "cyan" : "magenta"}>
                          {user.role === "WORKER" ? "Trabajador" : "Empresa"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-jm-text-secondary">{getDepartment(user)}</td>
                      <td className="px-4 py-3">{renderActions(user)}</td>
                    </tr>
                    {observationUserId === user.id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3">
                          {renderObservationInput(user)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista cards — mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {users.map((user) => (
              <div key={user.id} className="bg-jm-card border border-jm-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium">{renderName(user)}</h3>
                  <Badge variant={user.role === "WORKER" ? "cyan" : "magenta"}>
                    {user.role === "WORKER" ? "Trabajador" : "Empresa"}
                  </Badge>
                </div>
                <div className="text-sm text-jm-text-secondary space-y-1 mb-3">
                  <p className="break-all">
                    <span className="text-jm-text-tertiary">Email: </span>
                    {user.email}
                  </p>
                  <p>
                    <span className="text-jm-text-tertiary">Departamento: </span>
                    {getDepartment(user)}
                  </p>
                </div>
                {renderActions(user)}
                {observationUserId === user.id && renderObservationInput(user)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}