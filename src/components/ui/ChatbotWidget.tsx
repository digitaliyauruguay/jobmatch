/*
 * Archivo: src/components/ui/ChatbotWidget.tsx
 * Qué hace: Botón flotante de chat con el asistente de IA de JobMatch.
 * Aparece fijo en la esquina inferior derecha; al hacer click abre/cierra
 * un panel de chat que habla con /api/agent. Mantiene el estilo visual
 * (colores jm-*, iconos tabler) del resto de la app.
 *
 * Se monta desde el layout de trabajador, así que solo aparece para
 * usuarios logueados con rol WORKER (la ruta ya está protegida por
 * middleware.ts). Si más adelante querés mostrarlo también a empresas,
 * importalo de la misma forma en (company)/layout.tsx.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconMessageChatbot, IconX, IconSend } from "@tabler/icons-react";

type ChatMsg = { role: "user" | "assistant"; text: string };

// Detecta rutas internas tipo "/worker/dashboard?jobId=..." dentro del texto
// del agente y las convierte en links clickeables (navegación de Next.js,
// sin recargar la página). El resto del texto se muestra tal cual.
function renderConEnlaces(texto: string) {
  const patronEnlace = /\/worker\/dashboard\?jobId=[A-Za-z0-9_-]+/g;
  const partes = texto.split(patronEnlace);
  const enlaces = texto.match(patronEnlace) ?? [];

  return partes.flatMap((parte, i) => {
    const nodos: React.ReactNode[] = [parte];
    if (enlaces[i]) {
      nodos.push(
        <Link
          key={i}
          href={enlaces[i]}
          className="text-jm-cyan-light underline hover:text-jm-cyan-light/80"
        >
          Ver oferta →
        </Link>
      );
    }
    return nodos;
  });
}

export default function ChatbotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "¡Hola! Preguntame por ofertas de trabajo — por ejemplo \"¿hay trabajos de gastronomía en Montevideo?\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || cargando) return;

    setMensajes((m) => [...m, { role: "user", text: texto }]);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texto, history: historial }),
      });
      const data = await res.json();

      if (data.error) {
        setMensajes((m) => [
          ...m,
          { role: "assistant", text: "Uh, tuve un problema para responder. Probá de nuevo en un rato." },
        ]);
      } else {
        setMensajes((m) => [...m, { role: "assistant", text: data.reply }]);
        setHistorial(data.history);
      }
    } catch {
      setMensajes((m) => [
        ...m,
        { role: "assistant", text: "No me pude conectar. Revisá tu conexión e intentá de nuevo." },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      {/* Panel de chat */}
      {abierto && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[min(380px,calc(100vw-2rem))] h-[500px] max-h-[70vh]
                     bg-jm-card border border-jm-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-jm-border bg-jm-card">
            <div className="flex items-center gap-2">
              <IconMessageChatbot size={20} className="text-jm-magenta-light" />
              <span className="text-sm font-medium text-jm-text">Asistente JobMatch</span>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-jm-text-tertiary hover:text-jm-text transition-colors cursor-pointer"
              aria-label="Cerrar chat"
            >
              <IconX size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-jm-magenta text-white"
                      : "bg-jm-card-hover text-jm-text border border-jm-border-soft"
                  }`}
                >
                  {m.role === "assistant" ? renderConEnlaces(m.text) : m.text}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start">
                <div className="bg-jm-card-hover border border-jm-border-soft text-jm-text-tertiary rounded-xl px-3 py-2 text-sm">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={finRef} />
          </div>

          {/* Input */}
          <form onSubmit={enviar} className="flex items-center gap-2 p-3 border-t border-jm-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu pregunta..."
              className="flex-1 bg-jm-black border border-jm-border-soft rounded-lg px-3 py-2 text-sm text-jm-text
                         placeholder:text-jm-text-tertiary focus:outline-none focus:border-jm-magenta"
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              className="bg-jm-magenta text-white rounded-lg p-2 hover:bg-jm-magenta-light hover:text-jm-magenta-bg
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Enviar"
            >
              <IconSend size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-jm-magenta text-white
                   shadow-[0_4px_20px_rgba(153,53,86,0.5)] hover:bg-jm-magenta-light hover:text-jm-magenta-bg
                   hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer"
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
      >
        {abierto ? <IconX size={24} /> : <IconMessageChatbot size={24} />}
      </button>
    </>
  );
}
