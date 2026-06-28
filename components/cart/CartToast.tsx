"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/store";

export function CartToast() {
  const lastAdded = useCart((s) => s.lastAdded);
  const [dismissed, setDismissed] = useState<number | null>(null);

  // Derivado en render: visible mientras no se haya descartado este `at`.
  const visible = lastAdded && lastAdded.at !== dismissed ? lastAdded : null;

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => setDismissed(lastAdded.at), 2800);
    return () => clearTimeout(t);
  }, [lastAdded]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.at}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-primary/15 bg-surface px-5 py-3 shadow-xl shadow-ink/10"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-bg">
              <ShoppingCart className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-sm text-ink">
              <span className="font-medium text-primary">{visible.nombre}</span> agregado al carrito
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
