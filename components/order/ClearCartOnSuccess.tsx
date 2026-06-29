"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/cart/store";

// Limpia el carrito una vez cuando el pago quedó aprobado.
export function ClearCartOnSuccess() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
