import { Heart } from "lucide-react";
import { getClientes } from "@/lib/admin/queries";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Clientes</h1>
      <p className="mt-1 text-ink/60">{clientes.length} {clientes.length === 1 ? "persona" : "personas"} que han confiado en Savia.</p>

      <div className="mt-6 space-y-3">
        {clientes.length === 0 ? (
          <p className="rounded-2xl border border-primary/10 bg-surface/40 p-8 text-center text-muted">
            Todavía no hay clientes.
          </p>
        ) : (
          clientes.map((c) => (
            <div key={c.telefono} className="rounded-2xl border border-primary/10 bg-surface/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{c.nombre}</p>
                  <p className="text-sm text-muted">{c.telefono}{c.email ? ` · ${c.email}` : ""}</p>
                  {c.favorito && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink/70">
                      <Heart className="h-3.5 w-3.5 text-accent" aria-hidden /> Favorito: {c.favorito}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-primary">{formatCOP(c.totalComprado)}</p>
                  <p className="text-xs text-muted">{c.pedidos} {c.pedidos === 1 ? "pedido" : "pedidos"}</p>
                  <p className="mt-1 text-xs text-muted">Última: {new Date(c.ultimaCompra).toLocaleDateString("es-CO")}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
