"use server";
import { pedidoSchema, type PedidoInput } from "./schema";
import type { CartItem } from "@/lib/cart/store";
import { getSupabaseServer } from "@/lib/supabase/server";

export type CrearPedidoResult =
  | { ok: true; referencia: string }
  | { ok: false; error: string };

export async function crearPedido(
  input: PedidoInput,
  items: CartItem[],
  referencia: string,
): Promise<CrearPedidoResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const subtotal = items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      referencia,
      nombre: parsed.data.nombre,
      telefono: parsed.data.telefono,
      email: parsed.data.email || null,
      departamento: parsed.data.departamento,
      ciudad: parsed.data.ciudad,
      direccion: parsed.data.direccion,
      notas: parsed.data.notas || null,
      subtotal_cop: subtotal,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear el pedido. Intenta de nuevo." };

  const rows = items.map((i) => ({
    pedido_id: data.id as string,
    slug: i.slug,
    nombre: i.nombre,
    precio_cop: i.precioCOP,
    qty: i.qty,
  }));
  const { error: itemsError } = await supabase.from("pedido_items").insert(rows);
  if (itemsError) return { ok: false, error: "No se pudieron guardar los productos del pedido." };

  return { ok: true, referencia };
}
