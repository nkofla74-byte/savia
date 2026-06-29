"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Carrito (${count})`}
        className="relative grid h-11 w-11 place-items-center rounded-full text-primary transition-colors hover:bg-primary/10"
      >
        <ShoppingCart className="h-7 w-7" aria-hidden />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-bg"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
