import Link from "next/link";
import { ShoppingBag, Wallet, CalendarDays, HandCoins, Truck, Boxes, Plus } from "lucide-react";
import { getDashboard } from "@/lib/admin/queries";
import { ESTADOS, ESTADO_LABEL, ESTADO_UI } from "@/lib/admin/estados";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

function saludo(): string {
  const hora = Number(
    new Date().toLocaleString("en-US", { timeZone: "America/Bogota", hour: "2-digit", hour12: false }),
  );
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function AdminDashboardPage() {
  const d = await getDashboard();

  const cards = [
    { label: "Ventas de hoy", value: formatCOP(d.ventasHoy), Icon: Wallet, href: "/admin/ventas" },
    { label: "Ventas del mes", value: formatCOP(d.ventasMes), Icon: CalendarDays, href: "/admin/ventas" },
    { label: "Por cobrar", value: formatCOP(d.porCobrar), Icon: HandCoins, href: "/admin/clientes" },
    { label: "Por entregar", value: String(d.pendientesEntregar), Icon: Truck, href: "/admin/pedidos" },
    { label: "Pedidos de hoy", value: String(d.pedidosHoy), Icon: ShoppingBag, href: "/admin/pedidos" },
    { label: "Stock bajo", value: String(d.stockBajo), Icon: Boxes, href: "/admin/inventario" },
  ];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{saludo()}, Savia 🌿</h1>
          <p className="mt-1 text-ink/60">Esto es lo que está pasando hoy.</p>
        </div>
        <Link
          href="/admin/ventas/nueva"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-bg transition hover:opacity-90"
        >
          <Plus className="h-5 w-5" aria-hidden /> Nueva venta
        </Link>
      </div>

      {/* Resumen */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-primary/10 bg-surface/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">{value}</p>
          </Link>
        ))}
      </div>

      {/* Estado de pedidos */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Estado de pedidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={`/admin/pedidos?estado=${e}`}
              className="flex items-center justify-between rounded-2xl border border-primary/10 bg-surface/40 px-5 py-4 transition-colors hover:bg-surface/70"
            >
              <span className="flex items-center gap-3 text-ink/80">
                <span className={`h-2.5 w-2.5 rounded-full ${ESTADO_UI[e].dot}`} aria-hidden />
                {ESTADO_LABEL[e]}
              </span>
              <span className="font-display text-lg font-bold text-primary">{d.porEstado[e]}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
