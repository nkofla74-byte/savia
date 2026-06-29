import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPedidos, getItemsDePedidos } from "@/lib/admin/queries";
import { ESTADOS, ESTADO_LABEL, ESTADO_UI } from "@/lib/admin/estados";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const pedidos = await getPedidos({ q, estado });
  const items = await getItemsDePedidos(pedidos.map((p) => p.id));
  const resumenItems = (id: string) =>
    items
      .filter((i) => i.pedido_id === id)
      .map((i) => `${i.nombre} ×${i.qty}`)
      .join(", ");

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Pedidos</h1>

      <form className="mt-6 flex flex-wrap gap-3" action="/admin/pedidos">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por referencia o nombre"
          className="flex-1 rounded-xl border border-primary/20 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <select name="estado" defaultValue={estado ?? ""} className="rounded-xl border border-primary/20 bg-surface px-3 py-2 text-sm text-ink">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-bg hover:opacity-90">Filtrar</button>
        <Link href="/admin/pedidos" className="rounded-full border border-primary/30 px-5 py-2 text-sm text-primary hover:bg-primary/10">Limpiar</Link>
      </form>

      <div className="mt-6 space-y-3">
        {pedidos.length === 0 ? (
          <p className="rounded-2xl border border-primary/10 bg-surface/40 p-8 text-center text-muted">
            No hay pedidos con esos criterios.
          </p>
        ) : (
          pedidos.map((p) => (
            <Link
              key={p.id}
              href={`/admin/pedidos/${p.id}`}
              className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-surface/50 p-5 transition duration-200 hover:border-accent/30 hover:bg-surface/80"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium text-primary">{p.referencia}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-bg px-2.5 py-0.5 text-xs text-ink/80">
                    <span className={`h-2 w-2 rounded-full ${ESTADO_UI[p.estado].dot}`} aria-hidden />
                    {ESTADO_LABEL[p.estado]}
                  </span>
                </div>
                <p className="mt-1 font-medium text-ink">{p.nombre}</p>
                <p className="line-clamp-1 text-sm text-muted">{resumenItems(p.id) || "—"}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display font-bold text-primary">{formatCOP(p.total_cop ?? p.subtotal_cop)}</p>
                <p className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString("es-CO")}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
