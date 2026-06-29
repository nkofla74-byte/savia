import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MapPin, StickyNote } from "lucide-react";
import { getClienteDetalle } from "@/lib/admin/ventas";
import { RegistrarAbono } from "@/components/admin/venta/RegistrarAbono";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGO_BADGE: Record<string, string> = {
  pagado: "bg-emerald-500/15 text-emerald-700",
  aprobado: "bg-emerald-500/15 text-emerald-700",
  abono: "bg-amber-500/15 text-amber-700",
  pendiente: "bg-rose-500/15 text-rose-700",
};

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClienteDetalle(id);
  if (!data) notFound();
  const { cliente, pedidos, totalComprado, saldoTotal } = data;

  return (
    <section>
      <Link href="/admin/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Clientes
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-primary">{cliente.nombre}</h1>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" aria-hidden /> {cliente.telefono}</span>
        {cliente.direccion && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden /> {cliente.direccion}</span>}
      </div>
      {cliente.observaciones && (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-surface/60 px-3 py-2 text-sm text-ink/70">
          <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /> {cliente.observaciones}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary/10 bg-surface/60 p-5">
          <p className="text-sm text-muted">Total comprado</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{formatCOP(totalComprado)}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${saldoTotal > 0 ? "border-rose-500/30 bg-rose-500/5" : "border-primary/10 bg-surface/60"}`}>
          <p className="text-sm text-muted">Saldo pendiente</p>
          <p className={`mt-1 font-display text-2xl font-bold ${saldoTotal > 0 ? "text-rose-600" : "text-primary"}`}>{formatCOP(saldoTotal)}</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl font-bold text-primary">Historial de pedidos</h2>
      <div className="mt-3 space-y-2">
        {pedidos.length === 0 ? (
          <p className="rounded-2xl border border-primary/10 bg-surface/40 p-6 text-center text-muted">Sin pedidos todavía.</p>
        ) : (
          pedidos.map((p) => (
            <div key={p.id} className="rounded-2xl border border-primary/10 bg-surface/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/admin/pedidos/${p.id}`} className="font-medium text-ink hover:text-primary hover:underline">
                    {p.referencia}
                  </Link>
                  <p className="text-xs text-muted">
                    {new Date(p.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-primary">{formatCOP(p.total)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PAGO_BADGE[p.estado_pago] ?? "bg-primary/10 text-primary"}`}>
                    {p.estado_pago}
                  </span>
                </div>
              </div>
              {p.saldo > 0 && (
                <div className="mt-2 border-t border-primary/5 pt-2">
                  <p className="text-sm text-rose-600">Saldo: {formatCOP(p.saldo)} <span className="text-muted">· abonado {formatCOP(p.abonado)}</span></p>
                  <RegistrarAbono pedidoId={p.id} saldo={p.saldo} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
