import type { Metadata } from "next";
import { Truck, MessageCircle, ShieldCheck } from "lucide-react";
import { OrderForm } from "@/components/order/OrderForm";

export const metadata: Metadata = {
  title: "Pedido con envío nacional — Savia",
  description: "Completa tus datos de envío. Enviamos a toda Colombia.",
};

const garantias = [
  { icon: Truck, t: "Enviamos a toda Colombia", d: "Cobertura nacional, puerta a puerta." },
  { icon: MessageCircle, t: "Coordinación por WhatsApp", d: "Confirmamos y acordamos el envío contigo." },
  { icon: ShieldCheck, t: "Datos protegidos", d: "Solo los usamos para tu entrega." },
];

const pasos = [
  { n: 1, label: "Carrito" },
  { n: 2, label: "Datos de envío" },
  { n: 3, label: "Confirmación" },
];

export default function PedidoPage() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Envío nacional · Colombia
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
          Completa tu pedido
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Déjanos tus datos de envío y coordinamos el resto por WhatsApp. Enviamos a toda Colombia.
        </p>

        {/* Pasos */}
        <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {pasos.map((p, i) => (
            <li key={p.n} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                    p.n === 2 ? "bg-primary text-bg" : "border border-primary/30 text-primary/70"
                  }`}
                >
                  {p.n}
                </span>
                <span className={p.n === 2 ? "font-medium text-ink" : "text-muted"}>{p.label}</span>
              </span>
              {i < pasos.length - 1 && <span className="h-px w-6 bg-primary/20" aria-hidden />}
            </li>
          ))}
        </ol>

        {/* Garantías */}
        <div className="mt-8 grid gap-4 rounded-3xl border border-primary/10 bg-surface/50 p-5 sm:grid-cols-3">
          {garantias.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.t} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-ink">{g.t}</p>
                  <p className="text-xs text-muted">{g.d}</p>
                </div>
              </div>
            );
          })}
        </div>

        <OrderForm />
      </div>
    </section>
  );
}
