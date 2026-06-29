import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { products } from "@/content/products";
import { presentacionesDe } from "./queries";

// ── Productos para el flujo de venta (catálogo + stock por presentación) ────
export type PresentacionVenta = { ml: number; precioCOP: number; stock: number };
export type ProductoVenta = { slug: string; nombre: string; linea: string; presentaciones: PresentacionVenta[] };

export async function getProductosParaVenta(): Promise<ProductoVenta[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("inventario").select("slug, ml, stock");
  const stockMap = new Map(
    ((data as { slug: string; ml: number; stock: number }[] | null) ?? []).map((r) => [`${r.slug}:${r.ml}`, r.stock]),
  );

  return products.map((p) => {
    const presentaciones: PresentacionVenta[] = presentacionesDe(p).map((ml) => {
      const precioCOP = p.presentaciones?.find((x) => x.ml === ml)?.precioCOP ?? p.precioCOP;
      return { ml, precioCOP, stock: stockMap.get(`${p.slug}:${ml}`) ?? 0 };
    });
    return { slug: p.slug, nombre: p.nombre, linea: p.linea, presentaciones };
  });
}

// ── Clientes (tabla real, con totales y saldo derivados) ────────────────────
export type ClienteRow = {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  direccion: string | null;
  observaciones: string | null;
};

export type ClienteListItem = ClienteRow & {
  pedidos: number;
  totalComprado: number;
  saldo: number;
  ultimaCompra: string | null;
};

type PedidoSaldo = {
  id: string;
  cliente_id: string | null;
  origen: string;
  estado_pago: string;
  total_cop: number | null;
  subtotal_cop: number;
  created_at: string;
};

function totalDe(p: { total_cop: number | null; subtotal_cop: number }): number {
  return p.total_cop ?? p.subtotal_cop;
}

async function cargarPedidosYAbonos() {
  const supabase = await createSupabaseServerClient();
  const [pedidosRes, abonosRes] = await Promise.all([
    supabase.from("pedidos").select("id, cliente_id, origen, estado_pago, total_cop, subtotal_cop, created_at"),
    supabase.from("abonos").select("pedido_id, monto_cop"),
  ]);
  const pedidos = (pedidosRes.data as PedidoSaldo[] | null) ?? [];
  const abonos = (abonosRes.data as { pedido_id: string; monto_cop: number }[] | null) ?? [];
  const abonadoPorPedido = new Map<string, number>();
  for (const a of abonos) abonadoPorPedido.set(a.pedido_id, (abonadoPorPedido.get(a.pedido_id) ?? 0) + a.monto_cop);
  return { pedidos, abonadoPorPedido };
}

export async function getClientesReal(): Promise<ClienteListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: clientesData } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });
  const clientes = (clientesData as ClienteRow[] | null) ?? [];
  const { pedidos, abonadoPorPedido } = await cargarPedidosYAbonos();

  const agg = new Map<string, { pedidos: number; totalComprado: number; saldo: number; ultimaCompra: string | null }>();
  for (const p of pedidos) {
    if (!p.cliente_id) continue;
    const a = agg.get(p.cliente_id) ?? { pedidos: 0, totalComprado: 0, saldo: 0, ultimaCompra: null };
    const total = totalDe(p);
    const esVenta = p.origen === "pos" || p.estado_pago === "aprobado";
    a.pedidos += 1;
    if (esVenta) a.totalComprado += total;
    if (p.origen === "pos") {
      const saldo = total - (abonadoPorPedido.get(p.id) ?? 0);
      if (saldo > 0) a.saldo += saldo;
    }
    if (!a.ultimaCompra || p.created_at > a.ultimaCompra) a.ultimaCompra = p.created_at;
    agg.set(p.cliente_id, a);
  }

  return clientes
    .map((c) => {
      const a = agg.get(c.id) ?? { pedidos: 0, totalComprado: 0, saldo: 0, ultimaCompra: null };
      return { ...c, ...a };
    })
    .sort((x, y) => y.saldo - x.saldo || y.totalComprado - x.totalComprado);
}

// ── Producción de terminados ────────────────────────────────────────────────
export type ProduccionRow = {
  id: string;
  slug: string;
  ml: number;
  cantidad: number;
  vendedor_email: string | null;
  nota: string | null;
  fecha: string;
};

export async function getProducciones(limit = 30): Promise<ProduccionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("producciones")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(limit);
  return (data as ProduccionRow[] | null) ?? [];
}

// ── Compras de insumos ──────────────────────────────────────────────────────
export type InsumoCompraRow = {
  id: string;
  insumo: string;
  cantidad: number;
  unidad: string;
  costo_cop: number;
  proveedor: string | null;
  vendedor_email: string | null;
  fecha: string;
};

export async function getInsumosCompras(limit = 50): Promise<InsumoCompraRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("insumos_compras")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(limit);
  return (data as InsumoCompraRow[] | null) ?? [];
}

// ── Ventas POS recientes ────────────────────────────────────────────────────
export type VentaReciente = {
  id: string;
  referencia: string;
  created_at: string;
  nombre: string;
  estado: string;
  estado_pago: string;
  total: number;
  saldo: number;
  vendedor_email: string | null;
};

export async function getVentasRecientes(limit = 20): Promise<VentaReciente[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pedidos")
    .select("id, referencia, created_at, nombre, estado, estado_pago, total_cop, subtotal_cop, vendedor_email")
    .eq("origen", "pos")
    .order("created_at", { ascending: false })
    .limit(limit);
  const ventas = (data as (PedidoSaldo & { referencia: string; nombre: string; estado: string; vendedor_email: string | null })[] | null) ?? [];
  if (ventas.length === 0) return [];

  const { data: abonosData } = await supabase
    .from("abonos")
    .select("pedido_id, monto_cop")
    .in("pedido_id", ventas.map((v) => v.id));
  const abonadoPorPedido = new Map<string, number>();
  for (const a of (abonosData as { pedido_id: string; monto_cop: number }[] | null) ?? []) {
    abonadoPorPedido.set(a.pedido_id, (abonadoPorPedido.get(a.pedido_id) ?? 0) + a.monto_cop);
  }

  return ventas.map((v) => {
    const total = totalDe(v);
    return {
      id: v.id,
      referencia: v.referencia,
      created_at: v.created_at,
      nombre: v.nombre,
      estado: v.estado,
      estado_pago: v.estado_pago,
      total,
      saldo: Math.max(0, total - (abonadoPorPedido.get(v.id) ?? 0)),
      vendedor_email: v.vendedor_email,
    };
  });
}

// ── Detalle de un cliente (historial + abonos) ──────────────────────────────
export type PedidoCliente = {
  id: string;
  referencia: string;
  created_at: string;
  origen: string;
  estado: string;
  estado_pago: string;
  total: number;
  abonado: number;
  saldo: number;
};

export type AbonoRow = {
  id: string;
  pedido_id: string;
  monto_cop: number;
  metodo_pago: string;
  fecha: string;
  nota: string | null;
};

export type ClienteDetalle = {
  cliente: ClienteRow;
  pedidos: PedidoCliente[];
  abonos: AbonoRow[];
  totalComprado: number;
  saldoTotal: number;
};

export async function getClienteDetalle(id: string): Promise<ClienteDetalle | null> {
  const supabase = await createSupabaseServerClient();
  const { data: clienteData } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!clienteData) return null;
  const cliente = clienteData as ClienteRow;

  const { data: pedidosData } = await supabase
    .from("pedidos")
    .select("id, referencia, created_at, origen, estado, estado_pago, total_cop, subtotal_cop")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false });
  const pedidosRaw = (pedidosData as (PedidoSaldo & { referencia: string; estado: string })[] | null) ?? [];

  const ids = pedidosRaw.map((p) => p.id);
  let abonos: AbonoRow[] = [];
  if (ids.length > 0) {
    const { data: abonosData } = await supabase
      .from("abonos")
      .select("id, pedido_id, monto_cop, metodo_pago, fecha, nota")
      .in("pedido_id", ids)
      .order("fecha", { ascending: false });
    abonos = (abonosData as AbonoRow[] | null) ?? [];
  }
  const abonadoPorPedido = new Map<string, number>();
  for (const a of abonos) abonadoPorPedido.set(a.pedido_id, (abonadoPorPedido.get(a.pedido_id) ?? 0) + a.monto_cop);

  let totalComprado = 0;
  let saldoTotal = 0;
  const pedidos: PedidoCliente[] = pedidosRaw.map((p) => {
    const total = totalDe(p);
    const abonado = abonadoPorPedido.get(p.id) ?? 0;
    const saldo = p.origen === "pos" ? Math.max(0, total - abonado) : 0;
    const esVenta = p.origen === "pos" || p.estado_pago === "aprobado";
    if (esVenta) totalComprado += total;
    saldoTotal += saldo;
    return {
      id: p.id,
      referencia: p.referencia,
      created_at: p.created_at,
      origen: p.origen,
      estado: p.estado,
      estado_pago: p.estado_pago,
      total,
      abonado,
      saldo,
    };
  });

  return { cliente, pedidos, abonos, totalComprado, saldoTotal };
}
