import { FlaskConical } from "lucide-react";
import { getInsumosCompras } from "@/lib/admin/ventas";
import { InsumoCompraForm } from "@/components/admin/InsumoCompraForm";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  const compras = await getInsumosCompras();
  const totalMes = compras
    .filter((c) => c.fecha.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s, c) => s + c.costo_cop, 0);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Insumos</h1>
          <p className="mt-1 text-ink/60">Registro de compras de materia prima.</p>
        </div>
        <InsumoCompraForm />
      </div>

      <div className="mt-6 rounded-2xl border border-primary/10 bg-surface/60 p-5">
        <p className="text-sm text-muted">Compras de este mes</p>
        <p className="mt-1 font-display text-2xl font-bold text-primary">{formatCOP(totalMes)}</p>
      </div>

      <div className="mt-6 space-y-2">
        {compras.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-surface/40 p-10 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-muted" aria-hidden />
            <p className="mt-3 text-muted">Aún no hay compras registradas.</p>
          </div>
        ) : (
          compras.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-surface/50 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.insumo}</p>
                <p className="text-xs text-muted">
                  {c.cantidad} {c.unidad}
                  {c.proveedor && <> · {c.proveedor}</>} · {new Date(c.fecha).toLocaleDateString("es-CO")}
                </p>
              </div>
              <p className="shrink-0 font-display font-bold text-primary">{formatCOP(c.costo_cop)}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
