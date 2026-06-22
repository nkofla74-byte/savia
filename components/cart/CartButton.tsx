"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart/store";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Carrito (${count})`} className="relative text-sm text-primary">
        Carrito
        {count > 0 && <span className="absolute -right-3 -top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-xs text-bg">{count}</span>}
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
