"use client";
import { useState } from "react";
import { marcarMensajeLeido, eliminarMensaje } from "@/lib/admin/actions";
import type { MensajeRow } from "@/lib/admin/queries";

export function MensajeCard({ mensaje }: { mensaje: MensajeRow }) {
  const [leido, setLeido] = useState(mensaje.leido);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onToggle = async () => {
    setBusy(true);
    setError(null);
    const nuevo = !leido;
    setLeido(nuevo);
    const res = await marcarMensajeLeido(mensaje.id, nuevo);
    setBusy(false);
    if (!res.ok) {
      setLeido(!nuevo);
      setError(res.error);
    }
  };

  const onEliminar = async () => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    setBusy(true);
    const res = await eliminarMensaje(mensaje.id);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className={`rounded-2xl border border-primary/10 p-5 ${leido ? "bg-surface/30" : "bg-surface/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{mensaje.asunto} {!leido && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-bg">nuevo</span>}</p>
          <p className="text-sm text-muted">{mensaje.nombre} · {mensaje.telefono}{mensaje.email ? ` · ${mensaje.email}` : ""}</p>
          <p className="mt-1 text-xs text-muted">{new Date(mensaje.created_at).toLocaleString("es-CO")}</p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap border-t border-primary/10 pt-3 text-sm text-ink/85">{mensaje.mensaje}</p>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      <div className="mt-3 flex gap-4 text-xs">
        <button type="button" onClick={() => void onToggle()} disabled={busy} className="text-primary hover:underline disabled:opacity-60">
          {leido ? "Marcar como no leído" : "Marcar como leído"}
        </button>
        <button type="button" onClick={() => void onEliminar()} disabled={busy} className="text-accent hover:underline disabled:opacity-60">
          Eliminar
        </button>
      </div>
    </div>
  );
}
