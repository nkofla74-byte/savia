import { presentacionesDe } from "@/lib/admin/queries";
import { getRecetas } from "@/lib/admin/auditoria";
import { products } from "@/content/products";
import { RecetaEditor } from "@/components/admin/RecetaEditor";

export const dynamic = "force-dynamic";

export default async function RecetasPage() {
  const recetas = await getRecetas();
  const opciones = products.map((p) => ({ slug: p.slug, nombre: p.nombre, ml: presentacionesDe(p) }));

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Recetas</h1>
      <p className="mt-1 text-ink/60">Define cuánto insumo consume cada presentación. Alimenta la auditoría.</p>

      <div className="mt-6 max-w-2xl">
        <RecetaEditor productos={opciones} recetas={recetas} />
      </div>
    </section>
  );
}
