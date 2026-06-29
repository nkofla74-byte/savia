import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, MapPin, CreditCard, User, Package } from "lucide-react";
import { getPedido } from "@/lib/admin/queries";
import {
  ESTADO_LABEL,
  ESTADO_UI,
  ESTADO_PAGO_LABEL,
  METODO_LABEL,
  FLUJO,
} from "@/lib/admin/estados";
import { waClienteHref } from "@/lib/admin/whatsapp";
import { formatCOP } from "@/lib/utils";
import { PedidoAcciones } from "@/components/admin/PedidoAcciones";

export const dynamic = "force-dynamic";

function Card({ titulo, Icon, children }: { titulo: string; Icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-surface/50 p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
        <Icon className="h-5 w-5 text-accent" aria-hidden />
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPedido(id);
  if (!data) notFound();
  const { pedido, items } = data;

  const enFlujo = FLUJO.includes(pedido.estado);
  const idxActual = FLUJO.indexOf(pedido.estado);
  const subtotal = pedido.subtotal_cop;
  const total = pedido.total_cop ?? pedido.subtotal_cop;

  return (
    <section>
      <Link href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-primary">{pedido.referencia}</h1>
          <p className="mt-1 text-sm text-muted">{new Date(pedido.created_at).toLocaleString("es-CO")}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface px-4 py-1.5 text-sm font-medium text-ink">
          <span className={`h-2.5 w-2.5 rounded-full ${ESTADO_UI[pedido.estado].dot}`} aria-hidden />
          {ESTADO_LABEL[pedido.estado]}
        </span>
      </div>

      {/* Progreso del flujo */}
      {enFlujo ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {FLUJO.map((e, i) => {
            const hecho = i <= idxActual;
            return (
              <div
                key={e}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                  hecho ? "border-primary/20 bg-primary/5 text-primary" : "border-primary/10 text-muted"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${hecho ? ESTADO_UI[e].dot : "bg-muted/40"}`} aria-hidden />
                {ESTADO_LABEL[e]}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-600">
          Este pedido está <strong>cancelado</strong>.
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Cliente + productos */}
        <div className="space-y-6 lg:col-span-2">
          <Card titulo="Cliente" Icon={User}>
            <p className="font-medium text-ink">{pedido.nombre}</p>
            <div className="mt-3 space-y-2 text-sm text-ink/80">
              <p className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" aria-hidden />
                <a href={waClienteHref(pedido)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {pedido.telefono}
                </a>
              </p>
              {pedido.email && <p className="text-ink/70">{pedido.email}</p>}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{pedido.direccion}, {pedido.ciudad}, {pedido.departamento}</span>
              </p>
              {pedido.notas && <p className="text-ink/60">Notas: {pedido.notas}</p>}
            </div>
          </Card>

          <Card titulo="Productos" Icon={Package}>
            <ul className="divide-y divide-primary/10">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-ink">{i.nombre} <span className="text-muted">×{i.qty}</span></span>
                  <span className="text-ink/80">{formatCOP(i.precio_cop * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-primary/10 pt-4 text-sm">
              <div className="flex justify-between text-ink/70"><dt>Subtotal</dt><dd>{formatCOP(subtotal)}</dd></div>
              <div className="flex justify-between text-ink/70"><dt>Envío</dt><dd>{formatCOP(pedido.envio_cop)}</dd></div>
              <div className="flex justify-between font-display text-base font-bold text-primary"><dt>Total</dt><dd>{formatCOP(total)}</dd></div>
            </dl>
          </Card>
        </div>

        {/* Pago + acciones */}
        <div className="space-y-6">
          <Card titulo="Pago" Icon={CreditCard}>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Método</dt><dd className="text-ink">{METODO_LABEL[pedido.metodo_pago]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Estado</dt><dd className="text-ink">{ESTADO_PAGO_LABEL[pedido.estado_pago]}</dd></div>
              {pedido.wompi_transaction_id && (
                <div className="flex justify-between gap-3"><dt className="text-muted">Wompi</dt><dd className="truncate font-mono text-xs text-ink/70">{pedido.wompi_transaction_id}</dd></div>
              )}
            </dl>
          </Card>

          <div className="rounded-2xl border border-primary/10 bg-surface/50 p-6">
            <PedidoAcciones id={pedido.id} estadoInicial={pedido.estado} />
            <a
              href={waClienteHref(pedido)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Contactar cliente
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
