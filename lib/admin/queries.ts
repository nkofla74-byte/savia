import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { ESTADOS, type EstadoPedido } from "./estados";

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

export type Dashboard = {
  pedidosHoy: number;
  ventasHoy: number;
  pendientesPago: number;
  mensajesNoLeidos: number;
  totalPedidos: number;
  porEstado: Record<EstadoPedido, number>;
};

export async function getDashboard(): Promise<Dashboard> {
  const supabase = await createSupabaseServerClient();
  const [pedidosRes, mensajesRes] = await Promise.all([
    supabase.from("pedidos").select("estado, estado_pago, total_cop, subtotal_cop, created_at"),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false),
  ]);

  const rows = (pedidosRes.data as
    | { estado: string; estado_pago: string; total_cop: number | null; subtotal_cop: number | null; created_at: string }[]
    | null) ?? [];

  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const esHoy = (iso: string) =>
    new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Bogota" }) === hoy;

  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<EstadoPedido, number>;
  let pedidosHoy = 0;
  let ventasHoy = 0;
  let pendientesPago = 0;

  for (const r of rows) {
    if (r.estado in porEstado) porEstado[r.estado as EstadoPedido] += 1;
    if (r.estado_pago === "pendiente") pendientesPago += 1;
    if (esHoy(r.created_at)) {
      pedidosHoy += 1;
      if (r.estado_pago === "aprobado") ventasHoy += r.total_cop ?? r.subtotal_cop ?? 0;
    }
  }

  return {
    pedidosHoy,
    ventasHoy,
    pendientesPago,
    mensajesNoLeidos: mensajesRes.count ?? 0,
    totalPedidos: rows.length,
    porEstado,
  };
}
