import type { Metadata } from "next";
import { OrderForm } from "@/components/order/OrderForm";

export const metadata: Metadata = {
  title: "Pedido con envío nacional — Savia",
  description: "Completa tus datos de envío. Enviamos a toda Colombia.",
};

export default function PedidoPage() {
  return (
    <section className="py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Pedido con envío nacional</h1>
      <p className="mt-2 text-muted">Enviamos a toda Colombia. Completa tus datos y coordinamos el envío por WhatsApp.</p>
      <OrderForm />
    </section>
  );
}
