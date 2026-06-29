import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { products } from "@/content/products";
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

export type InventarioItem = { slug: string; ml: number; nombre: string; linea: string; stock: number };

/** Presentaciones (ml) de un producto: las explícitas o su tamaño único. */
export function presentacionesDe(p: { tamanoMl: number; presentaciones?: { ml: number }[] }): number[] {
  return p.presentaciones ? p.presentaciones.map((x) => x.ml) : [p.tamanoMl];
}

export async function getInventario(): Promise<InventarioItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("inventario").select("slug, ml, stock");
  const stockMap = new Map(
    ((data as { slug: string; ml: number; stock: number }[] | null) ?? []).map((r) => [`${r.slug}:${r.ml}`, r.stock]),
  );
  return products.flatMap((p) =>
    presentacionesDe(p).map((ml) => ({
      slug: p.slug,
      ml,
      nombre: p.nombre,
      linea: p.linea,
      stock: stockMap.get(`${p.slug}:${ml}`) ?? 0,
    })),
  );
}

export async function getPedido(id: string): Promise<{ pedido: PedidoRow; items: PedidoItemRow[] } | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: itemsData } = await supabase.from("pedido_items").select("*").eq("pedido_id", id);
  return { pedido: data as PedidoRow, items: (itemsData as PedidoItemRow[] | null) ?? [] };
}

export type Cliente = {
  telefono: string;
  nombre: string;
  email: string | null;
  pedidos: number;
  totalComprado: number;
  favorito: string | null;
  ultimaCompra: string;
};

type PedidoMini = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  total_cop: number | null;
  subtotal_cop: number;
  estado_pago: string;
  created_at: string;
};

async function cargarPedidosEItems() {
  const supabase = await createSupabaseServerClient();
  const [pedidosRes, itemsRes] = await Promise.all([
    supabase.from("pedidos").select("id, nombre, telefono, email, total_cop, subtotal_cop, estado_pago, created_at"),
    supabase.from("pedido_items").select("pedido_id, nombre, qty"),
  ]);
  const pedidos = (pedidosRes.data as PedidoMini[] | null) ?? [];
  const items = (itemsRes.data as { pedido_id: string; nombre: string; qty: number }[] | null) ?? [];
  return { pedidos, items };
}

const soloDigitos = (t: string) => t.replace(/\D/g, "");

export async function getClientes(): Promise<Cliente[]> {
  const { pedidos, items } = await cargarPedidosEItems();
  const pedidoTelefono = new Map(pedidos.map((p) => [p.id, soloDigitos(p.telefono)]));

  const acc = new Map<
    string,
    { nombre: string; email: string | null; pedidos: number; totalComprado: number; ultimaCompra: string; productos: Map<string, number> }
  >();

  for (const p of pedidos) {
    const key = soloDigitos(p.telefono);
    const c = acc.get(key) ?? { nombre: p.nombre, email: p.email, pedidos: 0, totalComprado: 0, ultimaCompra: p.created_at, productos: new Map() };
    c.pedidos += 1;
    if (p.estado_pago === "aprobado") c.totalComprado += p.total_cop ?? p.subtotal_cop;
    if (p.created_at > c.ultimaCompra) {
      c.ultimaCompra = p.created_at;
      c.nombre = p.nombre;
      c.email = p.email;
    }
    acc.set(key, c);
  }

  for (const it of items) {
    const key = pedidoTelefono.get(it.pedido_id);
    if (!key) continue;
    const c = acc.get(key);
    if (!c) continue;
    c.productos.set(it.nombre, (c.productos.get(it.nombre) ?? 0) + it.qty);
  }

  return [...acc.entries()]
    .map(([telefono, c]) => {
      const favorito = [...c.productos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { telefono, nombre: c.nombre, email: c.email, pedidos: c.pedidos, totalComprado: c.totalComprado, favorito, ultimaCompra: c.ultimaCompra };
    })
    .sort((a, b) => b.totalComprado - a.totalComprado);
}

export type Reportes = {
  ventas30: number;
  pedidos30: number;
  topProductos: { nombre: string; qty: number }[];
  clientesNuevos30: number;
};

export async function getReportes(): Promise<Reportes> {
  const { pedidos, items } = await cargarPedidosEItems();
  const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();

  let ventas30 = 0;
  let pedidos30 = 0;
  const pedidosRecientes = new Set<string>();
  for (const p of pedidos) {
    if (p.created_at >= desde) {
      pedidos30 += 1;
      pedidosRecientes.add(p.id);
      if (p.estado_pago === "aprobado") ventas30 += p.total_cop ?? p.subtotal_cop;
    }
  }

  const qtyPorProducto = new Map<string, number>();
  for (const it of items) {
    if (!pedidosRecientes.has(it.pedido_id)) continue;
    qtyPorProducto.set(it.nombre, (qtyPorProducto.get(it.nombre) ?? 0) + it.qty);
  }
  const topProductos = [...qtyPorProducto.entries()]
    .map(([nombre, qty]) => ({ nombre, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Clientes nuevos: cuyo primer pedido cayó en los últimos 30 días.
  const primerPedido = new Map<string, string>();
  for (const p of pedidos) {
    const key = soloDigitos(p.telefono);
    const actual = primerPedido.get(key);
    if (!actual || p.created_at < actual) primerPedido.set(key, p.created_at);
  }
  let clientesNuevos30 = 0;
  for (const fecha of primerPedido.values()) if (fecha >= desde) clientesNuevos30 += 1;

  return { ventas30, pedidos30, topProductos, clientesNuevos30 };
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
  ventasMes: number;
  porCobrar: number;
  pendientesEntregar: number;
  pendientesPago: number;
  stockBajo: number;
  mensajesNoLeidos: number;
  totalPedidos: number;
  porEstado: Record<EstadoPedido, number>;
};

/** Un pedido cuenta como venta real si es POS, o si es web con pago aprobado. */
function esVenta(estadoPago: string, origen: string): boolean {
  return origen === "pos" || estadoPago === "aprobado";
}

/** Estados que ya no esperan entrega. */
const ESTADOS_CERRADOS = new Set(["entregado", "finalizado", "cancelado"]);

export async function getDashboard(): Promise<Dashboard> {
  const supabase = await createSupabaseServerClient();
  const [pedidosRes, abonosRes, invRes, mensajesRes] = await Promise.all([
    supabase.from("pedidos").select("id, estado, estado_pago, origen, total_cop, subtotal_cop, created_at"),
    supabase.from("abonos").select("pedido_id, monto_cop"),
    supabase.from("inventario").select("stock"),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false),
  ]);

  const rows = (pedidosRes.data as
    | { id: string; estado: string; estado_pago: string; origen: string; total_cop: number | null; subtotal_cop: number | null; created_at: string }[]
    | null) ?? [];
  const abonos = (abonosRes.data as { pedido_id: string; monto_cop: number }[] | null) ?? [];
  const stocks = (invRes.data as { stock: number }[] | null) ?? [];

  const abonadoPorPedido = new Map<string, number>();
  for (const a of abonos) abonadoPorPedido.set(a.pedido_id, (abonadoPorPedido.get(a.pedido_id) ?? 0) + a.monto_cop);

  const ahora = new Date();
  const hoy = ahora.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const mes = hoy.slice(0, 7); // YYYY-MM
  const bogotaFecha = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<EstadoPedido, number>;
  let pedidosHoy = 0;
  let ventasHoy = 0;
  let ventasMes = 0;
  let porCobrar = 0;
  let pendientesEntregar = 0;
  let pendientesPago = 0;

  for (const r of rows) {
    if (r.estado in porEstado) porEstado[r.estado as EstadoPedido] += 1;
    if (r.estado_pago === "pendiente") pendientesPago += 1;
    if (!ESTADOS_CERRADOS.has(r.estado)) pendientesEntregar += 1;

    const total = r.total_cop ?? r.subtotal_cop ?? 0;
    const venta = esVenta(r.estado_pago, r.origen);

    if (r.origen === "pos") {
      const saldo = total - (abonadoPorPedido.get(r.id) ?? 0);
      if (saldo > 0) porCobrar += saldo;
    }

    if (venta) {
      const fecha = bogotaFecha(r.created_at);
      if (fecha === hoy) ventasHoy += total;
      if (fecha.slice(0, 7) === mes) ventasMes += total;
    }
    if (bogotaFecha(r.created_at) === hoy) pedidosHoy += 1;
  }

  return {
    pedidosHoy,
    ventasHoy,
    ventasMes,
    porCobrar,
    pendientesEntregar,
    pendientesPago,
    stockBajo: stocks.filter((s) => s.stock < 5).length,
    mensajesNoLeidos: mensajesRes.count ?? 0,
    totalPedidos: rows.length,
    porEstado,
  };
}
