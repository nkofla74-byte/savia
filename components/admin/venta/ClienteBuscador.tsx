"use client";
import { useMemo, useState } from "react";
import { Search, UserPlus, Check, X } from "lucide-react";
import { crearCliente } from "@/lib/admin/actions";

export type ClienteSel = { id: string; nombre: string; telefono: string; direccion: string | null };

const soloDigitos = (t: string) => t.replace(/\D/g, "");

export function ClienteBuscador({
  clientes,
  seleccionado,
  onSelect,
}: {
  clientes: ClienteSel[];
  seleccionado: ClienteSel | null;
  onSelect: (c: ClienteSel | null) => void;
}) {
  const [q, setQ] = useState("");
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clientes.slice(0, 6);
    const dig = soloDigitos(term);
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          (dig.length > 0 && soloDigitos(c.telefono).includes(dig)),
      )
      .slice(0, 6);
  }, [q, clientes]);

  if (seleccionado) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{seleccionado.nombre}</p>
          <p className="text-sm text-muted">{seleccionado.telefono}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-primary transition hover:bg-primary/10"
        >
          <X className="h-4 w-4" aria-hidden /> Cambiar
        </button>
      </div>
    );
  }

  const guardarCliente = async () => {
    setBusy(true);
    setError(null);
    const res = await crearCliente({ nombre, telefono, direccion, observaciones });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSelect({ id: res.id, nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim() || null });
    setCreando(false);
    setNombre("");
    setTelefono("");
    setDireccion("");
    setObservaciones("");
  };

  if (creando) {
    return (
      <div className="space-y-3 rounded-2xl border border-primary/10 bg-surface/50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre *"
            className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            inputMode="tel"
            placeholder="Teléfono *"
            className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Dirección (opcional)"
          className="w-full rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Observaciones (opcional)"
          className="w-full rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void guardarCliente()}
            disabled={busy || !nombre.trim() || telefono.trim().length < 5}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
          >
            <Check className="h-4 w-4" aria-hidden /> Guardar cliente
          </button>
          <button
            type="button"
            onClick={() => { setCreando(false); setError(null); }}
            className="rounded-lg px-4 py-2 text-sm text-muted transition hover:bg-primary/5"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-surface px-3">
        <Search className="h-4 w-4 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente por nombre o teléfono"
          className="w-full bg-transparent py-2.5 text-sm text-ink outline-none"
        />
      </div>

      {filtrados.length > 0 && (
        <ul className="divide-y divide-primary/5 overflow-hidden rounded-xl border border-primary/10 bg-surface/50">
          {filtrados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-primary/5"
              >
                <span className="font-medium text-ink">{c.nombre}</span>
                <span className="text-sm text-muted">{c.telefono}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => { setCreando(true); setNombre(q.replace(/\d/g, "").trim()); setTelefono(soloDigitos(q)); }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/30 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
      >
        <UserPlus className="h-4 w-4" aria-hidden /> Crear cliente nuevo
      </button>
    </div>
  );
}
