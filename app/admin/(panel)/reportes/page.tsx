import { TrendingUp, ShoppingBag, UserPlus, Download } from "lucide-react";
import { getReportes } from "@/lib/admin/queries";
import { getReportesCompleto } from "@/lib/admin/reportes";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DESCARGAS: { tipo: string; label: string }[] = [
  { tipo: "ventas-por-vendedor", label: "Ventas por vendedor" },
  { tipo: "productos-mas-vendidos", label: "Productos más vendidos" },
  { tipo: "clientes-con-saldo", label: "Clientes con saldo" },
  { tipo: "inventario-actual", label: "Inventario actual" },
  { tipo: "compras-insumos", label: "Compras de insumos" },
];

export default async function ReportesPage() {
  const [r, completo] = await Promise.all([getReportes(), getReportesCompleto()]);
  const { ventasVendedor, clientesConSaldo } = completo;

  const cards = [
    { label: "Ventas (30 días)", value: formatCOP(r.ventas30), Icon: TrendingUp },
    { label: "Pedidos (30 días)", value: String(r.pedidos30), Icon: ShoppingBag },
    { label: "Clientes nuevos", value: String(r.clientesNuevos30), Icon: UserPlus },
  ];
  const maxQty = r.topProductos[0]?.qty ?? 1;

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Reportes</h1>
      <p className="mt-1 text-ink/60">Un vistazo a los últimos 30 días.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-primary/10 bg-surface/60 p-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Descargas (CSV — abre en Excel) */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Descargar para Excel</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {DESCARGAS.map((d) => (
            <a
              key={d.tipo}
              href={`/admin/reportes/export?tipo=${d.tipo}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-surface/50 px-4 py-3 transition hover:border-accent/30 hover:bg-surface/80"
            >
              <span className="font-medium text-ink">{d.label}</span>
              <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            </a>
          ))}
        </div>
      </div>

      {/* Ventas por vendedor */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Ventas por vendedor</h2>
        <div className="mt-4 space-y-2">
          {ventasVendedor.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-surface/40 p-6 text-center text-muted">Sin ventas registradas.</p>
          ) : (
            ventasVendedor.map((v) => (
              <div key={v.vendedor} className="flex items-center justify-between rounded-2xl border border-primary/10 bg-surface/50 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{v.vendedor}</p>
                  <p className="text-xs text-muted">{v.ventas} {v.ventas === 1 ? "venta" : "ventas"}</p>
                </div>
                <p className="font-display font-bold text-primary">{formatCOP(v.total)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clientes con saldo */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Clientes con saldo pendiente</h2>
        <div className="mt-4 space-y-2">
          {clientesConSaldo.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-surface/40 p-6 text-center text-muted">Nadie debe dinero. 🎉</p>
          ) : (
            clientesConSaldo.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{c.nombre}</p>
                  <p className="text-xs text-muted">{c.telefono}</p>
                </div>
                <p className="font-display font-bold text-rose-600">{formatCOP(c.saldo)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Productos más vendidos (30 días) */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Productos más vendidos</h2>
        <div className="mt-4 space-y-3">
          {r.topProductos.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-surface/40 p-8 text-center text-muted">Sin ventas en este periodo.</p>
          ) : (
            r.topProductos.map((p, i) => (
              <div key={p.nombre} className="rounded-2xl border border-primary/10 bg-surface/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3 text-ink">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    {p.nombre}
                  </span>
                  <span className="text-muted">{p.qty} uds</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
