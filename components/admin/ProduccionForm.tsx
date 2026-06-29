"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Loader2, Check } from "lucide-react";
import { registrarProduccion } from "@/lib/admin/actions";

export type OpcionProducto = { slug: string; nombre: string; ml: number[] };

export function ProduccionForm({ productos }: { productos: OpcionProducto[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [slug, setSlug] = useState(productos[0]?.slug ?? "");
  const seleccionado = productos.find((p) => p.slug === slug) ?? productos[0];
  const [ml, setMl] = useState<number>(seleccionado?.ml[0] ?? 0);
  const [cantidad, setCantidad] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const cambiarProducto = (nuevoSlug: string) => {
    setSlug(nuevoSlug);
    const p = productos.find((x) => x.slug === nuevoSlug);
    setMl(p?.ml[0] ?? 0);
  };

  const opcionesMl = productos.find((p) => p.slug === slug)?.ml ?? [];

  const guardar = async () => {
    setBusy(true);
    setError(null);
    setOk(false);
    const res = await registrarProduccion({ slug, ml, cantidad });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOk(true);
    setCantidad(0);
    router.refresh();
    setTimeout(() => setOk(false), 1500);
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-bg transition hover:opacity-90"
      >
        <Factory className="h-4 w-4" aria-hidden /> Registrar producción
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/15 bg-surface/60 p-4">
      <p className="font-display font-bold text-primary">Registrar producción</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={slug}
          onChange={(e) => cambiarProducto(e.target.value)}
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        >
          {productos.map((p) => (
            <option key={p.slug} value={p.slug}>{p.nombre}</option>
          ))}
        </select>
        <select
          value={ml}
          onChange={(e) => setMl(Number(e.target.value))}
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        >
          {opcionesMl.map((m) => (
            <option key={m} value={m}>{m} ml</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={cantidad || ""}
          onChange={(e) => setCantidad(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Cantidad producida"
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={busy || cantidad <= 0 || !slug}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {ok ? <><Check className="h-4 w-4" aria-hidden /> Sumado al stock</> : "Guardar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="px-3 py-2 text-sm text-muted hover:text-ink">
          Cerrar
        </button>
      </div>
    </div>
  );
}
