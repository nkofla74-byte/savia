"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { guardarRecetaItem, eliminarRecetaItem } from "@/lib/admin/actions";
import type { RecetaRow } from "@/lib/admin/auditoria";
import type { OpcionProducto } from "@/components/admin/ProduccionForm";

const UNIDADES = ["ml", "L", "g", "kg", "unidad", "gotas"];

export function RecetaEditor({ productos, recetas }: { productos: OpcionProducto[]; recetas: RecetaRow[] }) {
  const router = useRouter();
  const [slug, setSlug] = useState(productos[0]?.slug ?? "");
  const [ml, setMl] = useState<number>(productos[0]?.ml[0] ?? 0);
  const [insumo, setInsumo] = useState("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidad, setUnidad] = useState("ml");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opcionesMl = productos.find((p) => p.slug === slug)?.ml ?? [];
  const items = useMemo(
    () => recetas.filter((r) => r.slug === slug && r.ml === ml),
    [recetas, slug, ml],
  );

  const cambiarProducto = (s: string) => {
    setSlug(s);
    setMl(productos.find((p) => p.slug === s)?.ml[0] ?? 0);
  };

  const agregar = async () => {
    setBusy(true);
    setError(null);
    const res = await guardarRecetaItem({ slug, ml, insumo, cantidadPorUnidad: cantidad, unidad });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInsumo("");
    setCantidad(0);
    router.refresh();
  };

  const borrar = async (id: string) => {
    await eliminarRecetaItem(id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Selector producto + presentación (grandes para móvil) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={slug}
          onChange={(e) => cambiarProducto(e.target.value)}
          className="rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink"
        >
          {productos.map((p) => (
            <option key={p.slug} value={p.slug}>{p.nombre}</option>
          ))}
        </select>
        <select
          value={ml}
          onChange={(e) => setMl(Number(e.target.value))}
          className="rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink"
        >
          {opcionesMl.map((m) => (
            <option key={m} value={m}>{m} ml</option>
          ))}
        </select>
      </div>

      {/* Insumos de la receta actual */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-primary/20 bg-surface/40 p-4 text-center text-sm text-muted">
            Sin insumos en esta receta todavía.
          </p>
        ) : (
          items.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-surface/60 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{r.insumo}</p>
                <p className="text-xs text-muted">{r.cantidad_por_unidad} {r.unidad} por unidad</p>
              </div>
              <button
                type="button"
                onClick={() => void borrar(r.id)}
                aria-label="Eliminar insumo"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-rose-500 transition hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Agregar insumo */}
      <div className="space-y-3 rounded-2xl border border-primary/15 bg-surface/50 p-4">
        <p className="text-sm font-medium text-ink">Agregar insumo a la receta</p>
        <input
          value={insumo}
          onChange={(e) => setInsumo(e.target.value)}
          placeholder="Insumo (p. ej. Aceite de almendra)"
          className="w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm text-ink"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="any"
            value={cantidad || ""}
            onChange={(e) => setCantidad(Math.max(0, Number(e.target.value) || 0))}
            placeholder="Cantidad por unidad"
            className="w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm text-ink"
          />
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className="rounded-xl border border-primary/20 bg-surface px-3 py-3 text-sm text-ink"
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="button"
          onClick={() => void agregar()}
          disabled={busy || !insumo.trim() || cantidad <= 0}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          Agregar a la receta
        </button>
      </div>
    </div>
  );
}
