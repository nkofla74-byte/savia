import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getClientesReal } from "@/lib/admin/ventas";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await getClientesReal();
  const conSaldo = clientes.filter((c) => c.saldo > 0).length;

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Clientes</h1>
      <p className="mt-1 text-ink/60">
        {clientes.length} {clientes.length === 1 ? "persona" : "personas"}
        {conSaldo > 0 && <> · <span className="text-rose-600">{conSaldo} con saldo pendiente</span></>}
      </p>

      <div className="mt-6 space-y-3">
        {clientes.length === 0 ? (
          <p className="rounded-2xl border border-primary/10 bg-surface/40 p-8 text-center text-muted">
            Todavía no hay clientes. Se crean al registrar una venta.
          </p>
        ) : (
          clientes.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-surface/50 p-5 transition hover:border-accent/30 hover:bg-surface/80"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.nombre}</p>
                <p className="text-sm text-muted">{c.telefono}</p>
                <p className="mt-1 text-xs text-muted">
                  {c.pedidos} {c.pedidos === 1 ? "pedido" : "pedidos"}
                  {c.ultimaCompra && <> · última {new Date(c.ultimaCompra).toLocaleDateString("es-CO")}</>}
                </p>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <p className="font-display text-lg font-bold text-primary">{formatCOP(c.totalComprado)}</p>
                  {c.saldo > 0 && <p className="text-xs font-medium text-rose-600">Debe {formatCOP(c.saldo)}</p>}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
