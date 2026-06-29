"use server";
import { pedidoSchema, type PedidoInput } from "./schema";
import { ENVIO_COP, calcularTotal } from "./envio";
import type { CartItem } from "@/lib/cart/store";
import { getSupabaseServer } from "@/lib/supabase/server";
import { generateOrderRef } from "@/lib/cart/reference";
import { firmaIntegridad } from "@/lib/wompi/signature";
import { buildWompiCheckoutUrl } from "@/lib/wompi/checkout";

export type CrearPedidoResult =
  | { ok: true; referencia: string }
  | { ok: false; error: string };

export type CrearPedidoWompiResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function subtotalDe(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
}

async function insertarPedido(
  parsed: PedidoInput,
  items: CartItem[],
  opts: { referencia: string; metodoPago: "manual" | "wompi" },
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
    metodo_pago: opts.metodoPago,
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

// Flujo Nequi manual: guarda el pedido (incluye envío) y devuelve la referencia.
export async function crearPedido(
  input: PedidoInput,
  items: CartItem[],
  referencia: string,
): Promise<CrearPedidoResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const res = await insertarPedido(parsed.data, items, { referencia, metodoPago: "manual" });
  if (!res.ok) return res;
  return { ok: true, referencia };
}

// Flujo Wompi: guarda el pedido pendiente y devuelve la URL del Web Checkout.
export async function crearPedidoWompi(
  input: PedidoInput,
  items: CartItem[],
): Promise<CrearPedidoWompiResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!publicKey || !integritySecret) {
    return { ok: false, error: "El pago con tarjeta no está disponible por ahora." };
  }

  const referencia = generateOrderRef();
  const res = await insertarPedido(parsed.data, items, { referencia, metodoPago: "wompi" });
  if (!res.ok) return res;

  // La referencia de Wompi es el uuid del pedido (única, sin colisiones).
  const amountInCents = res.total * 100;
  const signature = firmaIntegridad(res.id, amountInCents, "COP", integritySecret);
  const url = buildWompiCheckoutUrl({
    publicKey,
    amountInCents,
    reference: res.id,
    redirectUrl: `${siteUrl}/pedido/resultado?pedido=${res.id}`,
    signature,
    customer: {
      fullName: parsed.data.nombre,
      email: parsed.data.email || undefined,
      phone: parsed.data.telefono,
    },
  });
  return { ok: true, url };
}
