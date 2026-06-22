"use client";
import { useCart } from "@/lib/cart/store";

export function AddToCart({ slug, nombre, precioCOP }: { slug: string; nombre: string; precioCOP: number }) {
  const add = useCart((s) => s.add);
  return (
    <button type="button" onClick={() => add({ slug, nombre, precioCOP })}
      className="mt-6 rounded-full bg-primary px-8 py-3 font-medium text-bg transition-transform active:scale-95 hover:opacity-90">
      Agregar al carrito
    </button>
  );
}
