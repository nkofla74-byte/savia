import Link from "next/link";
import { getPedidos, getItemsDePedidos } from "@/lib/admin/queries";
import { ESTADOS, ESTADO_LABEL } from "@/lib/admin/estados";
import { PedidoCard } from "@/components/admin/PedidoCard";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const pedidos = await getPedidos({ q, estado });
  const items = await getItemsDePedidos(pedidos.map((p) => p.id));
  const itemsPorPedido = (id: string) => items.filter((i) => i.pedido_id === id);

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Pedidos</h1>

      <form className="mt-6 flex flex-wrap gap-3" action="/admin/pedidos">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por referencia o nombre"
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        />
        <select name="estado" defaultValue={estado ?? ""} className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-bg hover:opacity-90">Filtrar</button>
        <Link href="/admin/pedidos" className="rounded-full border border-primary/30 px-5 py-2 text-sm text-primary hover:bg-primary/10">Limpiar</Link>
      </form>

      <div className="mt-6 space-y-4">
        {pedidos.length === 0 ? (
          <p className="text-muted">No hay pedidos con esos criterios.</p>
        ) : (
          pedidos.map((p) => <PedidoCard key={p.id} pedido={p} items={itemsPorPedido(p.id)} />)
        )}
      </div>
    </section>
  );
}
