import type { CartItem } from "./store";
import { formatCOP } from "@/lib/utils";

export type Customer = { nombre: string; telefono: string; ciudad: string; direccion: string };

export function buildWhatsAppMessage(items: CartItem[], customer: Customer, whatsappNumber: string) {
  const subtotal = items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
  const lines = [
    "Hola Savia 🌿, quiero hacer un pedido:",
    "",
    ...items.map((i) => `• ${i.nombre} x${i.qty} — ${formatCOP(i.precioCOP * i.qty)}`),
    "",
    `Subtotal: ${formatCOP(subtotal)}`,
    "",
    "Mis datos:",
    `Nombre: ${customer.nombre}`,
    `Teléfono: ${customer.telefono}`,
    `Ciudad: ${customer.ciudad}`,
    `Dirección: ${customer.direccion}`,
  ];
  const text = lines.join("\n");
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  return { text, url, subtotal };
}
