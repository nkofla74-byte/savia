import Link from "next/link";
import type { Metadata } from "next";
import { Check, Clock, X } from "lucide-react";
import { getSupabaseService } from "@/lib/supabase/service";
import { ClearCartOnSuccess } from "@/components/order/ClearCartOnSuccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultado del pago — Savia",
  robots: { index: false },
};

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;

  let estadoPago = "pendiente";
  let referencia = "";
  if (pedido) {
    const supabase = getSupabaseService();
    const { data } = await supabase
      .from("pedidos")
      .select("referencia, estado_pago")
      .eq("id", pedido)
      .single();
    if (data) {
      estadoPago = data.estado_pago as string;
      referencia = data.referencia as string;
    }
  }

  const aprobado = estadoPago === "aprobado";
  const rechazado = estadoPago === "rechazado" || estadoPago === "error";

  return (
    <section className="py-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-primary/10 bg-surface p-8 text-center shadow-sm">
        {aprobado && <ClearCartOnSuccess />}
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          {aprobado ? (
            <Check className="h-7 w-7 text-primary" aria-hidden />
          ) : rechazado ? (
            <X className="h-7 w-7 text-accent" aria-hidden />
          ) : (
            <Clock className="h-7 w-7 text-primary" aria-hidden />
          )}
        </div>

        {aprobado && (
          <>
            <p className="mt-4 font-display text-2xl text-primary">¡Pago confirmado! 🌿</p>
            <p className="mt-2 text-ink/80">
              Tu referencia es <strong className="font-mono text-primary">{referencia}</strong>.
              Preparamos tu pedido y coordinamos el envío.
            </p>
          </>
        )}
        {!aprobado && !rechazado && (
          <>
            <p className="mt-4 font-display text-2xl text-primary">Estamos confirmando tu pago</p>
            <p className="mt-2 text-ink/80">
              Puede tardar unos segundos. Te avisaremos por WhatsApp en cuanto se confirme.
            </p>
          </>
        )}
        {rechazado && (
          <>
            <p className="mt-4 font-display text-2xl text-accent">El pago no se completó</p>
            <p className="mt-2 text-ink/80">
              No te preocupes: puedes intentarlo de nuevo.
            </p>
          </>
        )}

        <Link
          href={rechazado ? "/pedido" : "/tienda"}
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-bg transition hover:opacity-90"
        >
          {rechazado ? "Volver a intentar" : "Volver a la tienda"}
        </Link>
      </div>
    </section>
  );
}
