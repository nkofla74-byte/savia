"use server";
import { pedidoSchema, type PedidoInput } from "./schema";
import { ENVIO_COP, calcularTotal } from "./envio";
import type { CartItem } from "@/lib/cart/store";
import { getSupabaseServer } from "@/lib/supabase/server";
import { generateOrderRef } from "@/lib/cart/reference";
import { crearLinkPago } from "@/lib/bold/checkout";

export type CrearPedidoBoldResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function subtotalDe(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
}

async function insertarPedido(
  parsed: PedidoInput,
  items: CartItem[],
  opts: { referencia: string },
): Promise<{ ok: true; id: string; subtotal: number; total: number } | { ok: false; error: string }> {
  const subtotal = subtotalDe(items);
  const total = calcularTotal(subtotal);
  const supabase = getSupabaseServer();
  const pedidoId = crypto.randomUUID();

  const { error } = await supabase.from("pedidos").insert({
    id: pedidoId,
    referencia: opts.referencia,
    nombre: parsed.nombre,
    telefono: parsed.telefono,
    email: parsed.email || null,
    departamento: parsed.departamento,
    ciudad: parsed.ciudad,
    direccion: parsed.direccion,
    notas: parsed.notas || null,
    subtotal_cop: subtotal,
    envio_cop: ENVIO_COP,
    total_cop: total,
    metodo_pago: "bold",
    estado_pago: "pendiente",
  });
  if (error) return { ok: false, error: "No se pudo crear el pedido. Intenta de nuevo." };

  const rows = items.map((i) => ({
    pedido_id: pedidoId,
    slug: i.slug,
    nombre: i.nombre,
    precio_cop: i.precioCOP,
    qty: i.qty,
  }));
  const { error: itemsError } = await supabase.from("pedido_items").insert(rows);
  if (itemsError) return { ok: false, error: "No se pudieron guardar los productos del pedido." };

  return { ok: true, id: pedidoId, subtotal, total };
}

// Flujo Bold: guarda el pedido pendiente y devuelve la URL del Link de pago.
export async function crearPedidoBold(
  input: PedidoInput,
  items: CartItem[],
): Promise<CrearPedidoBoldResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const apiKey = process.env.BOLD_API_KEY ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!apiKey) {
    return { ok: false, error: "El pago no está disponible por ahora." };
  }

  const referencia = generateOrderRef();
  const res = await insertarPedido(parsed.data, items, { referencia });
  if (!res.ok) return res;

  // La referencia que viaja a Bold es el uuid del pedido (única, sin colisiones).
  const link = await crearLinkPago({
    apiKey,
    amountCop: res.total,
    reference: res.id,
    description: `Pedido Savia ${referencia}`,
    callbackUrl: `${siteUrl}/pedido/resultado?pedido=${res.id}`,
    payerEmail: parsed.data.email || undefined,
  });
  if (!link.ok) return { ok: false, error: link.error };
  return { ok: true, url: link.url };
}
