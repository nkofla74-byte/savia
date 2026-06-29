"use client";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { formatCOP } from "@/lib/utils";

type Pres = { ml: number; precioCOP: number };

export function AgregarConTamano({
  slug,
  nombre,
  presentaciones,
  prominente = false,
}: {
  slug: string;
  nombre: string;
  presentaciones: Pres[];
  prominente?: boolean;
}) {
  // Por defecto, la presentación de 100 ml si existe; si no, la primera.
  const idx100 = presentaciones.findIndex((p) => p.ml === 100);
  const [idx, setIdx] = useState(idx100 >= 0 ? idx100 : 0);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const sel = presentaciones[idx] ?? presentaciones[0];

  const onAdd = () => {
    if (!sel) return;
    // El tamaño se codifica en slug/nombre: el carrito trata cada presentación como línea propia.
    add({ slug: `${slug}-${sel.ml}`, nombre: `${nombre} ${sel.ml} ml`, precioCOP: sel.precioCOP });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={prominente ? "mt-6" : "mt-4"}>
      <div className="flex flex-wrap gap-1.5">
        {presentaciones.map((p, i) => (
          <button
            key={p.ml}
            type="button"
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              i === idx
                ? "border-primary bg-primary text-bg"
                : "border-primary/25 text-ink/70 hover:border-primary/50"
            }`}
          >
            {p.ml} ml
          </button>
        ))}
      </div>

      <p className={`mt-3 font-display font-medium text-ink ${prominente ? "text-2xl" : "text-lg"}`}>
        {sel ? formatCOP(sel.precioCOP) : ""}
      </p>

      <button
        type="button"
        onClick={onAdd}
        aria-label={`Agregar ${nombre} ${sel?.ml ?? ""} ml al carrito`}
        className={
          prominente
            ? "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-bg transition hover:opacity-90 active:scale-95"
            : "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-bg active:scale-95"
        }
      >
        {added ? (
          <>
            <Check className="h-4 w-4" aria-hidden /> Agregado
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" aria-hidden /> Agregar
          </>
        )}
      </button>
    </div>
  );
}
