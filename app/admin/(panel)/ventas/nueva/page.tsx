import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClientesReal, getProductosParaVenta } from "@/lib/admin/ventas";
import { NuevaVentaForm } from "@/components/admin/venta/NuevaVentaForm";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage() {
  const [clientesRaw, productos] = await Promise.all([getClientesReal(), getProductosParaVenta()]);
  const clientes = clientesRaw.map((c) => ({ id: c.id, nombre: c.nombre, telefono: c.telefono, direccion: c.direccion }));

  return (
    <section>
      <Link href="/admin/ventas" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Ventas
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-primary">Nueva venta</h1>
      <p className="mt-1 text-ink/60">Registra una venta en menos de un minuto.</p>

      <div className="mx-auto mt-6 max-w-3xl">
        <NuevaVentaForm clientes={clientes} productos={productos} />
      </div>
    </section>
  );
}
