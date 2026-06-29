import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { getInventario } from "./queries";
import { getClientesReal, getInsumosCompras } from "./ventas";

// ── Ventas por vendedor ─────────────────────────────────────────────────────
export type VentaVendedor = { vendedor: string; ventas: number; total: number };

export async function getVentasPorVendedor(): Promise<VentaVendedor[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pedidos")
    .select("vendedor_email, total_cop, subtotal_cop")
    .eq("origen", "pos");
  const rows = (data as { vendedor_email: string | null; total_cop: number | null; subtotal_cop: number }[] | null) ?? [];
  const acc = new Map<string, VentaVendedor>();
  for (const r of rows) {
    const v = r.vendedor_email ?? "—";
    const a = acc.get(v) ?? { vendedor: v, ventas: 0, total: 0 };
    a.ventas += 1;
    a.total += r.total_cop ?? r.subtotal_cop;
    acc.set(v, a);
  }
  return [...acc.values()].sort((x, y) => y.total - x.total);
}

// ── Productos más vendidos ──────────────────────────────────────────────────
export type ProductoVendido = { nombre: string; ml: number | null; qty: number; total: number };

export async function getProductosMasVendidos(): Promise<ProductoVendido[]> {
  const supabase = await createSupabaseServerClient();
  const [pedidosRes, itemsRes] = await Promise.all([
    supabase.from("pedidos").select("id, origen, estado_pago"),
    supabase.from("pedido_items").select("pedido_id, nombre, ml, qty, precio_cop"),
  ]);
  const pedidos = (pedidosRes.data as { id: string; origen: string; estado_pago: string }[] | null) ?? [];
  const items = (itemsRes.data as { pedido_id: string; nombre: string; ml: number | null; qty: number; precio_cop: number }[] | null) ?? [];
  const esVenta = new Map(pedidos.map((p) => [p.id, p.origen === "pos" || p.estado_pago === "aprobado"]));

  const acc = new Map<string, ProductoVendido>();
  for (const it of items) {
    if (!esVenta.get(it.pedido_id)) continue;
    const k = `${it.nombre}|${it.ml ?? ""}`;
    const a = acc.get(k) ?? { nombre: it.nombre, ml: it.ml, qty: 0, total: 0 };
    a.qty += it.qty;
    a.total += it.qty * it.precio_cop;
    acc.set(k, a);
  }
  return [...acc.values()].sort((x, y) => y.qty - x.qty);
}

// ── Datos para la página de reportes ────────────────────────────────────────
export async function getReportesCompleto() {
  const [ventasVendedor, productos, clientes] = await Promise.all([
    getVentasPorVendedor(),
    getProductosMasVendidos(),
    getClientesReal(),
  ]);
  const clientesConSaldo = clientes.filter((c) => c.saldo > 0);
  return { ventasVendedor, productos, clientesConSaldo };
}

// ── CSV ─────────────────────────────────────────────────────────────────────
export type TipoReporte =
  | "ventas-por-vendedor"
  | "productos-mas-vendidos"
  | "clientes-con-saldo"
  | "inventario-actual"
  | "compras-insumos";

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escapar = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [headers, ...rows].map((fila) => fila.map(escapar).join(";"));
  return "﻿" + lineas.join("\r\n"); // BOM para que Excel respete UTF-8
}

export async function generarReporteCSV(tipo: TipoReporte): Promise<{ filename: string; csv: string }> {
  switch (tipo) {
    case "ventas-por-vendedor": {
      const data = await getVentasPorVendedor();
      return {
        filename: "ventas-por-vendedor.csv",
        csv: toCSV(["Vendedor", "Ventas", "Total COP"], data.map((d) => [d.vendedor, d.ventas, d.total])),
      };
    }
    case "productos-mas-vendidos": {
      const data = await getProductosMasVendidos();
      return {
        filename: "productos-mas-vendidos.csv",
        csv: toCSV(["Producto", "ml", "Cantidad", "Total COP"], data.map((d) => [d.nombre, d.ml ?? "", d.qty, d.total])),
      };
    }
    case "clientes-con-saldo": {
      const clientes = (await getClientesReal()).filter((c) => c.saldo > 0);
      return {
        filename: "clientes-con-saldo.csv",
        csv: toCSV(["Cliente", "Teléfono", "Saldo COP", "Total comprado COP"], clientes.map((c) => [c.nombre, c.telefono, c.saldo, c.totalComprado])),
      };
    }
    case "inventario-actual": {
      const inv = await getInventario();
      return {
        filename: "inventario-actual.csv",
        csv: toCSV(["Producto", "Línea", "ml", "Stock"], inv.map((i) => [i.nombre, i.linea, i.ml, i.stock])),
      };
    }
    case "compras-insumos": {
      const compras = await getInsumosCompras(1000);
      return {
        filename: "compras-insumos.csv",
        csv: toCSV(
          ["Insumo", "Cantidad", "Unidad", "Costo COP", "Proveedor", "Fecha"],
          compras.map((c) => [c.insumo, c.cantidad, c.unidad, c.costo_cop, c.proveedor ?? "", c.fecha]),
        ),
      };
    }
  }
}
