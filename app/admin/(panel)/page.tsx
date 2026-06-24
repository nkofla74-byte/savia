import Link from "next/link";
import { getResumen } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminResumenPage() {
  const r = await getResumen();
  const cards = [
    { label: "Pedidos totales", value: r.pedidos, href: "/admin/pedidos" },
    { label: "Pedidos nuevos", value: r.nuevos, href: "/admin/pedidos?estado=nuevo" },
    { label: "Mensajes sin leer", value: r.mensajesNoLeidos, href: "/admin/mensajes?noleidos=1" },
  ];
  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Resumen</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-primary/10 bg-surface/50 p-6 transition-transform hover:-translate-y-1">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{c.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
