"use client";
import { motion } from "framer-motion";
import type { CartItem } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/store";
import { formatCOP } from "@/lib/utils";

export function CartLine({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  return (
    <motion.div layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="flex items-center justify-between border-b border-primary/10 py-3">
      <div>
        <p className="text-ink">{item.nombre}</p>
        <p className="text-sm text-muted">{formatCOP(item.precioCOP)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Quitar uno" onClick={() => setQty(item.slug, item.qty - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 transition-colors hover:bg-primary/10">−</button>
        <span className="w-6 text-center">{item.qty}</span>
        <button type="button" aria-label="Agregar uno" onClick={() => setQty(item.slug, item.qty + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 transition-colors hover:bg-primary/10">+</button>
      </div>
    </motion.div>
  );
}
