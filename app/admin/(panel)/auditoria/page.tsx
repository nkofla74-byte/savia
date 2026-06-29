import Link from "next/link";
import { AlertTriangle, ScanSearch } from "lucide-react";
import { getAuditoria } from "@/lib/admin/auditoria";

export const dynamic = "force-dynamic";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(n);

export default async function AuditoriaPage() {
  const { filas, sinReceta } = await getAuditoria();
  const faltantes = filas.filter((f) => f.existenciaTeorica < 0).length;

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Auditoría</h1>
      <p className="mt-1 text-ink/60">
        Compara compras de insumos con la producción registrada usando las recetas. Solo estima; no modifica inventarios.
      </p>

      {sinReceta ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-700">
          Aún no hay recetas definidas. Define las recetas para que la auditoría pueda estimar el consumo.{" "}
          <Link href="/admin/recetas" className="font-medium underline">Ir a Recetas →</Link>
        </div>
      ) : filas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-primary/10 bg-surface/40 p-10 text-center">
          <ScanSearch className="mx-auto h-8 w-8 text-muted" aria-hidden />
          <p className="mt-3 text-muted">Sin datos para auditar todavía. Registra producción y compras de insumos.</p>
        </div>
      ) : (
        <>
          {faltantes > 0 && (
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {faltantes} {faltantes === 1 ? "insumo" : "insumos"} con consumo mayor a lo comprado (revisar recetas o merma).
            </div>
          )}

          <div className="mt-6 space-y-3">
            {filas.map((f) => {
              const faltante = f.existenciaTeorica < 0;
              return (
                <div
                  key={`${f.insumo}|${f.unidad}`}
                  className={`rounded-2xl border p-4 ${faltante ? "border-rose-500/30 bg-rose-500/5" : "border-primary/10 bg-surface/50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">{f.insumo}</p>
                    <span className="text-xs text-muted">{f.unidad}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-surface/70 p-2">
                      <p className="text-[11px] text-muted">Comprado</p>
                      <p className="font-display font-bold text-ink">{fmt(f.comprado)}</p>
                    </div>
                    <div className="rounded-xl bg-surface/70 p-2">
                      <p className="text-[11px] text-muted">Consumo est.</p>
                      <p className="font-display font-bold text-ink">{fmt(f.consumoEstimado)}</p>
                    </div>
                    <div className={`rounded-xl p-2 ${faltante ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
                      <p className="text-[11px] text-muted">Existencia teórica</p>
                      <p className={`font-display font-bold ${faltante ? "text-rose-600" : "text-emerald-700"}`}>{fmt(f.existenciaTeorica)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
