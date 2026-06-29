"use client";
import { useState } from "react";
import { Minus, Plus, Check, AlertTriangle } from "lucide-react";
import { actualizarStock } from "@/lib/admin/actions";

export function InventarioFila({ slug, nombre, linea, stock }: { slug: string; nombre: string; linea: string; stock: number }) {
  const [valor, setValor] = useState(stock);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const bajo = valor < 5;

  const guardar = async (nuevo: number) => {
    if (nuevo < 0 || nuevo === stock) {
      setValor(Math.max(0, nuevo));
      return;
    }
    setBusy(true);
    setError(null);
    setGuardado(false);
    setValor(nuevo);
    const res = await actualizarStock(slug, nuevo);
    setBusy(false);
    if (!res.ok) {
      setValor(stock);
      setError(res.error);
      return;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1200);
  };

  return (
    <div className="rounded-2xl border border-primary/10 bg-surface/50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{nombre}</p>
          <p className="text-sm text-muted">{linea}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void guardar(valor - 1)}
            disabled={busy || valor <= 0}
            aria-label="Restar uno"
            className="grid h-8 w-8 place-items-center rounded-full border border-primary/20 text-primary transition hover:bg-primary/10 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <input
            type="number"
            value={valor}
            min={0}
            onChange={(e) => setValor(Math.max(0, Number(e.target.value) || 0))}
            onBlur={() => void guardar(valor)}
            className="w-16 rounded-lg border border-primary/20 bg-surface px-2 py-1.5 text-center text-sm text-ink"
          />
          <button
            type="button"
            onClick={() => void guardar(valor + 1)}
            disabled={busy}
            aria-label="Sumar uno"
            className="grid h-8 w-8 place-items-center rounded-full border border-primary/20 text-primary transition hover:bg-primary/10 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
        <div className={`h-full rounded-full ${bajo ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(valor / 20, 1) * 100}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted">{valor} unidades</span>
        {bajo && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Stock bajo
          </span>
        )}
        {guardado && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Check className="h-3.5 w-3.5" aria-hidden /> Guardado
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
