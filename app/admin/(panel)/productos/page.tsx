import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { products } from "@/content/products";
import { getInventario } from "@/lib/admin/queries";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const inv = await getInventario();
  const stockDe = new Map<string, number>();
  for (const i of inv) stockDe.set(i.slug, (stockDe.get(i.slug) ?? 0) + i.stock);

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Productos</h1>
      <p className="mt-1 text-ink/60">
        El catálogo se edita en código (<span className="font-mono text-xs">content/products.ts</span>). Aquí ves el estado actual y el stock.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const desde = p.presentaciones ? Math.min(...p.presentaciones.map((x) => x.precioCOP)) : p.precioCOP;
          const stock = stockDe.get(p.slug) ?? 0;
          const bajo = stock < 5;
          return (
            <Link
              key={p.slug}
              href={`/producto/${p.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-primary/10 bg-surface/50 p-5 transition hover:border-accent/30 hover:bg-surface/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-bold text-primary">{p.nombre}</p>
                  <p className="text-sm text-accent">{p.linea}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.usos.map((u) => (
                  <span key={u} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">{u}</span>
                ))}
                {p.edicionEspecial && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Edición especial</span>}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-sm text-ink/80">{p.presentaciones ? "Desde " : ""}{formatCOP(desde)}</span>
                <span className={`text-sm font-medium ${bajo ? "text-amber-600" : "text-ink/70"}`}>{stock} en stock</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
