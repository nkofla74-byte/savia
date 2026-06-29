"use client";
import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import type { ProductoVenta } from "@/lib/admin/ventas";
import { formatCOP } from "@/lib/utils";

export type LineaVenta = { slug: string; ml: number; nombre: string; precio_cop: number; qty: number };

export function ProductoPicker({
  productos,
  onAdd,
}: {
  productos: ProductoVenta[];
  onAdd: (l: Omit<LineaVenta, "qty">) => void;
}) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(term) || p.linea.toLowerCase().includes(term),
    );
  }, [q, productos]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-surface px-3">
        <Search className="h-4 w-4 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto"
          className="w-full bg-transparent py-2.5 text-sm text-ink outline-none"
        />
      </div>

      <ul className="space-y-1.5">
        {filtrados.map((p) => {
          const expandido = abierto === p.slug;
          const primera = p.presentaciones[0];
          const unico = p.presentaciones.length === 1 && !!primera;
          return (
            <li key={p.slug} className="overflow-hidden rounded-xl border border-primary/10 bg-surface/50">
              <button
                type="button"
                onClick={() => {
                  if (unico && primera) {
                    onAdd({ slug: p.slug, ml: primera.ml, nombre: p.nombre, precio_cop: primera.precioCOP });
                  } else {
                    setAbierto(expandido ? null : p.slug);
                  }
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-primary/5"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{p.nombre}</span>
                  <span className="block text-xs text-muted">{p.linea}</span>
                </span>
                {unico && primera ? (
                  <span className="shrink-0 text-sm text-primary">{formatCOP(primera.precioCOP)}</span>
                ) : (
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted transition-transform ${expandido ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                )}
              </button>

              {!unico && expandido && (
                <div className="flex flex-wrap gap-2 border-t border-primary/5 bg-surface/30 px-4 py-3">
                  {p.presentaciones.map((pr) => (
                    <button
                      key={pr.ml}
                      type="button"
                      onClick={() => onAdd({ slug: p.slug, ml: pr.ml, nombre: p.nombre, precio_cop: pr.precioCOP })}
                      className="rounded-lg border border-primary/20 px-3 py-2 text-left transition hover:bg-primary/10"
                    >
                      <span className="block text-sm font-medium text-ink">{pr.ml} ml</span>
                      <span className="block text-xs text-primary">{formatCOP(pr.precioCOP)}</span>
                      <span className={`block text-xs ${pr.stock < 5 ? "text-amber-600" : "text-muted"}`}>
                        {pr.stock} disp.
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {filtrados.length === 0 && (
          <li className="rounded-xl border border-primary/10 bg-surface/40 px-4 py-6 text-center text-sm text-muted">
            Sin resultados.
          </li>
        )}
      </ul>
    </div>
  );
}
