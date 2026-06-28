"use client";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/lib/cart/store";

export function QuickAddButton({ slug, nombre, precioCOP }: { slug: string; nombre: string; precioCOP: number }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const onClick = () => {
    add({ slug, nombre, precioCOP });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Agregar ${nombre} al carrito`}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary transition active:scale-95 hover:bg-primary hover:text-bg"
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
  );
}
