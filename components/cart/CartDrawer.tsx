"use client";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/store";
import { formatCOP } from "@/lib/utils";
import { CartLine } from "./CartLine";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col bg-bg text-ink sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-primary">Tu pedido</SheetTitle></SheetHeader>
        {items.length === 0 ? (
          <p className="mt-8 text-muted">Tu carrito está vacío.</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto"><AnimatePresence initial={false}>{items.map((i) => <CartLine key={i.slug} item={i} />)}</AnimatePresence></div>
            <div className="border-t border-primary/10 pt-4">
              <div className="mb-4 flex justify-between font-medium"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
              <Link
                href="/pedido"
                onClick={() => onOpenChange(false)}
                className="block w-full rounded-full bg-primary py-3 text-center font-medium text-bg transition hover:opacity-90"
              >
                Continuar al pedido
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
