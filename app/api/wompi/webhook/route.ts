import { NextResponse } from "next/server";
import { verificarFirmaEvento, mapEstadoPago, type WompiEvent } from "@/lib/wompi/webhook";
import { getSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET ?? "";

export async function POST(req: Request) {
  let event: WompiEvent;
  try {
    event = (await req.json()) as WompiEvent;
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  if (!verificarFirmaEvento(event, EVENTS_SECRET)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  const tx = event.data?.transaction;
  if (!tx?.reference) return NextResponse.json({ ok: true });

  const supabase = getSupabaseService();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, total_cop, estado_pago")
    .eq("id", tx.reference)
    .single();

  if (!pedido) return NextResponse.json({ ok: true });
  // Idempotencia: si ya está aprobado, no reprocesar.
  if (pedido.estado_pago === "aprobado") return NextResponse.json({ ok: true });

  const estadoPago = mapEstadoPago(tx.status);
  const update: Record<string, unknown> = {
    estado_pago: estadoPago,
    wompi_transaction_id: tx.id,
  };

  if (estadoPago === "aprobado") {
    // Cruzar el monto contra el pedido. Si no coincide, marcar error (no despachar).
    if (pedido.total_cop != null && tx.amount_in_cents !== pedido.total_cop * 100) {
      update.estado_pago = "error";
    } else {
      update.estado = "confirmado";
    }
  }

  await supabase.from("pedidos").update(update).eq("id", tx.reference);
  return NextResponse.json({ ok: true });
}
