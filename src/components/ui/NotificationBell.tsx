/*
 * Archivo: src/components/ui/NotificationBell.tsx
 * Qué hace: Componente reutilizable de notificaciones que aparece en la
 * barra de navegación de todos los dashboards. Muestra un ícono de campana
 * con un contador de notificaciones no leídas. Al hacer clic despliega
 * un panel con todas las notificaciones y permite marcarlas como leídas.
 * Tema oscuro JobMatch, misma lógica funcional.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { IconBell } from "@tabler/icons-react";

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

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
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
        onClick={handleOpen}
        className="relative p-2 text-jm-text-tertiary hover:text-jm-text transition-colors cursor-pointer"
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-jm-red text-jm-red-light text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-jm-card border border-jm-border rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-jm-border">
            <p className="text-sm font-medium text-jm-text">Notificaciones</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-jm-text-tertiary text-center py-6">
                No tenés notificaciones.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-jm-border last:border-0 ${
                    !n.read ? "bg-jm-magenta-bg" : ""
                  }`}
                >
                  <p className="text-sm text-jm-text">{n.message}</p>
                  <p className="text-xs text-jm-text-tertiary mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}