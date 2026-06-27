import type { CartItem } from "./store";
import { formatCOP } from "@/lib/utils";

export type Customer = {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  departamento?: string;
  email?: string;
  notas?: string;
};

export function buildWhatsAppMessage(
  items: CartItem[],
  customer: Customer,
  whatsappNumber: string,
  reference: string,
) {
  const subtotal = items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
  const lines = [
    "Hola Savia 🌿, quiero hacer un pedido:",
    "",
    `Referencia: ${reference}`,
    "",
    ...items.map((i) => `• ${i.nombre} x${i.qty} — ${formatCOP(i.precioCOP * i.qty)}`),
    "",
    `Subtotal: ${formatCOP(subtotal)}`,
    "",
    "Pago: Nequi — ya realicé el pago, adjunto comprobante 📎",
    "",
    "Datos de envío:",
    `Nombre: ${customer.nombre}`,
    `Teléfono: ${customer.telefono}`,
    ...(customer.email ? [`Email: ${customer.email}`] : []),
    ...(customer.departamento ? [`Departamento: ${customer.departamento}`] : []),
    `Ciudad: ${customer.ciudad}`,
    `Dirección: ${customer.direccion}`,
    ...(customer.notas ? [`Notas: ${customer.notas}`] : []),
  ];
  const text = lines.join("\n");
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  return { text, url, subtotal };
}
