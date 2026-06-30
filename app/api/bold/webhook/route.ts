import { NextResponse } from "next/server";
import { verificarFirmaBold, mapEstadoPagoBold, type BoldEvent } from "@/lib/bold/webhook";
import { getSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

const SECRET = process.env.BOLD_SECRET_KEY ?? "";

export async function POST(req: Request) {
  // La firma se calcula sobre el body CRUDO: leer texto, no reserializar JSON.
  const raw = await req.text();
  const signature = req.headers.get("x-bold-signature");

  if (!verificarFirmaBold(raw, signature, SECRET)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let event: BoldEvent;
  try {
    event = JSON.parse(raw) as BoldEvent;
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const reference = event.data?.metadata?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  const supabase = getSupabaseService();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, total_cop, estado_pago")
    .eq("id", reference)
    .single();

  if (!pedido) return NextResponse.json({ ok: true });
  // Idempotencia: si ya está aprobado, no reprocesar.
  if (pedido.estado_pago === "aprobado") return NextResponse.json({ ok: true });

  const estadoPago = mapEstadoPagoBold(event.type);
  const update: Record<string, unknown> = {
    estado_pago: estadoPago,
    bold_payment_id: event.data?.payment_id ?? null,
  };

  if (estadoPago === "aprobado") {
    // Cruzar monto (COP, sin centavos). Si no coincide, marcar error (no despachar).
    const montoBold = event.data?.amount?.total;
    if (pedido.total_cop != null && montoBold !== pedido.total_cop) {
      update.estado_pago = "error";
    } else {
      update.estado = "confirmado";
    }
  }

  await supabase.from("pedidos").update(update).eq("id", reference);
  return NextResponse.json({ ok: true });
}
