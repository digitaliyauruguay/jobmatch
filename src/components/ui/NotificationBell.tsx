/*
 * Archivo: src/components/ui/NotificationBell.tsx
 * Qué hace: Componente reutilizable de notificaciones para la navbar.
 * Campana con contador de no leídas. Panel con scroll estilizado,
 * íconos por notificación para marcar como leída u ocultar (borrado
 * virtual), y botones globales para marcar todas leídas u ocultar
 * todas. Las notificaciones ocultas persisten en la DB con hidden=true
 * pero no se muestran al usuario. Tema oscuro JobMatch.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconX,
  IconTrash,
} from "@tabler/icons-react";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleHide = async (id: string) => {
    await fetch(`/api/notifications/${id}/hide`, { method: "PATCH" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleHideAll = async () => {
    await fetch("/api/notifications/hide-all", { method: "PATCH" });
    setNotifications([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-UY", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-jm-text-tertiary hover:text-jm-text transition-colors cursor-pointer"
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-jm-magenta text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-jm-card border border-jm-border rounded-2xl shadow-lg z-50 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-jm-border flex items-center justify-between">
            <p className="text-sm font-medium text-jm-text">Notificaciones</p>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMarkAllRead}
                  title="Marcar todas como leídas"
                  className="p-1.5 text-jm-text-tertiary hover:text-jm-green-light hover:bg-jm-green-bg rounded-lg transition-colors cursor-pointer"
                >
                  <IconChecks size={15} />
                </button>
                <button
                  onClick={handleHideAll}
                  title="Ocultar todas"
                  className="p-1.5 text-jm-text-tertiary hover:text-jm-red-light hover:bg-jm-red-bg rounded-lg transition-colors cursor-pointer"
                >
                  <IconTrash size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Lista con scroll estilizado */}
          <div
            className="max-h-80 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#232229 transparent",
            }}
          >
            {notifications.length === 0 ? (
              <p className="text-sm text-jm-text-tertiary text-center py-8">
                No tenés notificaciones.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-jm-border last:border-0 flex items-start gap-3 group transition-colors ${
                    !n.read ? "bg-jm-magenta-bg" : "hover:bg-jm-card-hover"
                  }`}
                >
                  {/* Punto indicador de no leída */}
                  <div className="mt-1.5 flex-shrink-0">
                    {!n.read ? (
                      <div className="w-2 h-2 rounded-full bg-jm-magenta" />
                    ) : (
                      <div className="w-2 h-2" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-jm-text leading-snug">{n.message}</p>
                    <p className="text-xs text-jm-text-tertiary mt-1">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>

                  {/* Acciones — visibles al hover */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        title="Marcar como leída"
                        className="p-1 text-jm-text-tertiary hover:text-jm-green-light hover:bg-jm-green-bg rounded-lg transition-colors cursor-pointer"
                      >
                        <IconCheck size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleHide(n.id)}
                      title="Ocultar"
                      className="p-1 text-jm-text-tertiary hover:text-jm-red-light hover:bg-jm-red-bg rounded-lg transition-colors cursor-pointer"
                    >
                      <IconX size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}