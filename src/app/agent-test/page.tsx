/*
 * Archivo: src/app/agent-test/page.tsx
 * Qué hace: Página mínima para probar el agente en el navegador, pegándole
 * directo a /api/agent. Es solo para desarrollo — no está enlazada desde
 * ningún menú. Antes de ir a producción, sacala o protegela con auth.
 */
"use client";

import { useState } from "react";

type ChatMsg = { role: "user" | "assistant"; text: string };

export default function AgentTestPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || loading) return;

    setMessages((m) => [...m, { role: "user", text: texto }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texto, history }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((m) => [...m, { role: "assistant", text: "Error: " + data.error }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
        setHistory(data.history);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "No se pudo conectar con el agente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h2>Probar el agente de JobMatch</h2>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 12,
          height: 400,
          overflowY: "auto",
          marginBottom: 12,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: "8px 0",
              textAlign: m.role === "user" ? "right" : "left",
              color: m.role === "user" ? "#0a5" : "#333",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <div style={{ color: "#999" }}>Pensando...</div>}
      </div>
      <form onSubmit={enviar} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: ¿hay trabajos de gastronomía en Montevideo?"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
}
