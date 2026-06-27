import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import type { EstadoPedido } from "./estados";

export type PedidoRow = {
  id: string;
  created_at: string;
  referencia: string;
  nombre: string;
  telefono: string;
  email: string | null;
  departamento: string;
  ciudad: string;
  direccion: string;
  notas: string | null;
  subtotal_cop: number;
  envio_cop: number;
  total_cop: number | null;
  metodo_pago: "manual" | "wompi";
  estado_pago: "pendiente" | "aprobado" | "rechazado" | "error";
  wompi_transaction_id: string | null;
  estado: EstadoPedido;
};

export type PedidoItemRow = {
  id: string;
  pedido_id: string;
  slug: string;
  nombre: string;
  precio_cop: number;
  qty: number;
};

export type MensajeRow = {
  id: string;
  created_at: string;
  nombre: string;
  email: string | null;
  telefono: string;
  asunto: string;
  mensaje: string;
  leido: boolean;
};

export async function getPedidos(opts: { q?: string; estado?: string } = {}): Promise<PedidoRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("pedidos").select("*").order("created_at", { ascending: false });
  if (opts.estado) query = query.eq("estado", opts.estado);
  if (opts.q) query = query.or(`referencia.ilike.%${opts.q}%,nombre.ilike.%${opts.q}%`);
  const { data } = await query;
  return (data as PedidoRow[] | null) ?? [];
}

export async function getItemsDePedidos(pedidoIds: string[]): Promise<PedidoItemRow[]> {
  if (pedidoIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pedido_items").select("*").in("pedido_id", pedidoIds);
  return (data as PedidoItemRow[] | null) ?? [];
}

export async function getMensajes(opts: { soloNoLeidos?: boolean } = {}): Promise<MensajeRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("mensajes").select("*").order("created_at", { ascending: false });
  if (opts.soloNoLeidos) query = query.eq("leido", false);
  const { data } = await query;
  return (data as MensajeRow[] | null) ?? [];
}

export async function getResumen(): Promise<{ pedidos: number; nuevos: number; mensajesNoLeidos: number }> {
  const supabase = await createSupabaseServerClient();
  const [pedidos, nuevos, mensajes] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "nuevo"),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false),
  ]);
  return {
    pedidos: pedidos.count ?? 0,
    nuevos: nuevos.count ?? 0,
    mensajesNoLeidos: mensajes.count ?? 0,
  };
}
