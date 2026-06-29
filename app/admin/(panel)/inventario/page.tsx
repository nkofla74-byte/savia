import { AlertTriangle } from "lucide-react";
import { getInventario, presentacionesDe } from "@/lib/admin/queries";
import { products } from "@/content/products";
import { InventarioFila } from "@/components/admin/InventarioFila";
import { ProduccionForm } from "@/components/admin/ProduccionForm";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const items = await getInventario();
  const bajos = items.filter((i) => i.stock < 5);
  const opciones = products.map((p) => ({ slug: p.slug, nombre: p.nombre, ml: presentacionesDe(p) }));

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Inventario</h1>
          <p className="mt-1 text-ink/60">Ajusta el stock y registra producción.</p>
        </div>
        <ProduccionForm productos={opciones} />
      </div>

      {bajos.length > 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {bajos.length} {bajos.length === 1 ? "producto" : "productos"} con menos de 5 unidades.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <InventarioFila key={`${i.slug}:${i.ml}`} slug={i.slug} ml={i.ml} nombre={i.nombre} linea={i.linea} stock={i.stock} />
        ))}
      </div>
    </section>
  );
}
