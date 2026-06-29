import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { getVentasRecientes } from "@/lib/admin/ventas";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGO_BADGE: Record<string, string> = {
  pagado: "bg-emerald-500/15 text-emerald-700",
  abono: "bg-amber-500/15 text-amber-700",
  pendiente: "bg-rose-500/15 text-rose-700",
};

export default async function VentasPage() {
  const ventas = await getVentasRecientes();

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Ventas</h1>
          <p className="mt-1 text-ink/60">Registra y revisa las ventas del mostrador.</p>
        </div>
        <Link
          href="/admin/ventas/nueva"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-bg transition hover:opacity-90"
        >
          <Plus className="h-5 w-5" aria-hidden /> Nueva venta
        </Link>
      </div>

      <div className="mt-6 space-y-2">
        {ventas.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-surface/40 p-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-muted" aria-hidden />
            <p className="mt-3 text-muted">Aún no hay ventas registradas.</p>
            <Link href="/admin/ventas/nueva" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Registrar la primera →
            </Link>
          </div>
        ) : (
          ventas.map((v) => (
            <Link
              key={v.id}
              href={`/admin/pedidos/${v.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-surface/50 p-4 transition hover:border-accent/30 hover:bg-surface/80"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{v.nombre}</p>
                <p className="text-xs text-muted">
                  {new Date(v.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="font-display font-bold text-primary">{formatCOP(v.total)}</p>
                  {v.saldo > 0 && <p className="text-xs text-rose-600">Debe {formatCOP(v.saldo)}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${PAGO_BADGE[v.estado_pago] ?? "bg-primary/10 text-primary"}`}>
                  {v.estado_pago}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
