"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart/store";

export function AddToCart({ slug, nombre, precioCOP }: { slug: string; nombre: string; precioCOP: number }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add({ slug, nombre, precioCOP });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      className="mt-6 rounded-full bg-primary px-8 py-3 font-medium text-bg transition-transform hover:opacity-90 active:scale-95"
    >
      {added ? "¡Agregado! 🌿" : "Agregar al carrito"}
    </button>
  );
}
