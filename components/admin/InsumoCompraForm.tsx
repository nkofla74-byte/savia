"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { registrarCompraInsumo } from "@/lib/admin/actions";

const UNIDADES = ["ml", "L", "g", "kg", "unidad"];

export function InsumoCompraForm() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [insumo, setInsumo] = useState("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidad, setUnidad] = useState("ml");
  const [costoCop, setCostoCop] = useState<number>(0);
  const [proveedor, setProveedor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setBusy(true);
    setError(null);
    const res = await registrarCompraInsumo({ insumo, cantidad, unidad, costoCop, proveedor });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInsumo("");
    setCantidad(0);
    setCostoCop(0);
    setProveedor("");
    setAbierto(false);
    router.refresh();
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-bg transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" aria-hidden /> Registrar compra
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/15 bg-surface/60 p-4">
      <p className="font-display font-bold text-primary">Nueva compra de insumo</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={insumo}
          onChange={(e) => setInsumo(e.target.value)}
          placeholder="Insumo (p. ej. Aceite de almendra)"
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink sm:col-span-2"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="any"
            value={cantidad || ""}
            onChange={(e) => setCantidad(Math.max(0, Number(e.target.value) || 0))}
            placeholder="Cantidad"
            className="w-full rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
          />
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <input
          type="number"
          min={0}
          value={costoCop || ""}
          onChange={(e) => setCostoCop(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Costo total (COP)"
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          placeholder="Proveedor (opcional)"
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink sm:col-span-2"
        />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={busy || !insumo.trim() || cantidad <= 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Guardar compra
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="px-3 py-2 text-sm text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}
