"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { getAdminUser } from "./auth";
import { esEstadoValido } from "./estados";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ActionResultId = { ok: true; id: string } | { ok: false; error: string };

export async function cambiarEstadoPedido(id: string, estado: string): Promise<ActionResult> {
  if (!esEstadoValido(estado)) return { ok: false, error: "Estado inválido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el estado." };
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function eliminarPedido(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el pedido." };
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function actualizarStock(slug: string, ml: number, stock: number): Promise<ActionResult> {
  if (!Number.isInteger(stock)) return { ok: false, error: "Stock inválido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("inventario")
    .upsert({ slug, ml, stock, updated_at: new Date().toISOString() }, { onConflict: "slug,ml" });
  if (error) return { ok: false, error: "No se pudo actualizar el stock." };
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  return { ok: true };
}

// ── Ventas POS · Clientes · Abonos ──────────────────────────────────────────
const itemVentaSchema = z.object({
  slug: z.string().min(1),
  ml: z.number().int().positive(),
  nombre: z.string().min(1),
  precio_cop: z.number().int().positive(),
  qty: z.number().int().positive(),
});

const nuevaVentaSchema = z.object({
  clienteId: z.string().uuid(),
  items: z.array(itemVentaSchema).min(1),
  metodoPago: z.string().min(1),
  estadoPago: z.enum(["pagado", "abono", "pendiente"]),
  montoAbonado: z.number().int().nonnegative().optional(),
  estadoPedido: z.enum(["pendiente", "entregado"]),
});
export type NuevaVentaInput = z.infer<typeof nuevaVentaSchema>;

export async function registrarVenta(input: NuevaVentaInput): Promise<ActionResultId> {
  const parsed = nuevaVentaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de la venta inválidos." };
  const v = parsed.data;
  if (v.estadoPago === "abono" && (!v.montoAbonado || v.montoAbonado <= 0)) {
    return { ok: false, error: "Indica el monto abonado." };
  }

  const user = await getAdminUser();
  if (!user?.email) return { ok: false, error: "Sesión no válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("registrar_venta", {
    p_cliente_id: v.clienteId,
    p_vendedor_email: user.email,
    p_items: v.items,
    p_metodo_pago: v.metodoPago,
    p_estado_pago: v.estadoPago,
    p_monto_abonado: v.montoAbonado ?? 0,
    p_estado_pedido: v.estadoPedido,
  });
  if (error) return { ok: false, error: "No se pudo registrar la venta." };

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/inventario");
  return { ok: true, id: data as string };
}

const nuevoClienteSchema = z.object({
  nombre: z.string().trim().min(1),
  telefono: z.string().trim().min(5),
  direccion: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});
export type NuevoClienteInput = z.infer<typeof nuevoClienteSchema>;

export async function crearCliente(input: NuevoClienteInput): Promise<ActionResultId> {
  const parsed = nuevoClienteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos del cliente inválidos." };
  const c = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ nombre: c.nombre, telefono: c.telefono, direccion: c.direccion || null, observaciones: c.observaciones || null })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe un cliente con ese teléfono." };
    return { ok: false, error: "No se pudo crear el cliente." };
  }
  revalidatePath("/admin/clientes");
  return { ok: true, id: (data as { id: string }).id };
}

export async function actualizarCliente(id: string, input: NuevoClienteInput): Promise<ActionResult> {
  const parsed = nuevoClienteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos del cliente inválidos." };
  const c = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clientes")
    .update({ nombre: c.nombre, telefono: c.telefono, direccion: c.direccion || null, observaciones: c.observaciones || null })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe un cliente con ese teléfono." };
    return { ok: false, error: "No se pudo actualizar el cliente." };
  }
  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin/clientes");
  return { ok: true };
}

const abonoSchema = z.object({
  pedidoId: z.string().uuid(),
  monto: z.number().int().positive(),
  metodoPago: z.string().min(1),
  nota: z.string().trim().optional(),
});

export async function registrarAbono(input: z.infer<typeof abonoSchema>): Promise<ActionResult> {
  const parsed = abonoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos del abono inválidos." };
  const a = parsed.data;
  const user = await getAdminUser();
  if (!user?.email) return { ok: false, error: "Sesión no válida." };

  const supabase = await createSupabaseServerClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, total_cop, subtotal_cop, cliente_id")
    .eq("id", a.pedidoId)
    .maybeSingle();
  if (!pedido) return { ok: false, error: "Pedido no encontrado." };

  const { error } = await supabase.from("abonos").insert({
    pedido_id: a.pedidoId,
    monto_cop: a.monto,
    metodo_pago: a.metodoPago,
    vendedor_email: user.email,
    nota: a.nota || null,
  });
  if (error) return { ok: false, error: "No se pudo registrar el abono." };

  // Actualiza estado_pago según el saldo restante.
  const { data: abonosData } = await supabase.from("abonos").select("monto_cop").eq("pedido_id", a.pedidoId);
  const abonado = ((abonosData as { monto_cop: number }[] | null) ?? []).reduce((s, x) => s + x.monto_cop, 0);
  const total = (pedido as { total_cop: number | null; subtotal_cop: number }).total_cop ??
    (pedido as { subtotal_cop: number }).subtotal_cop;
  const nuevoEstado = abonado >= total ? "pagado" : "abono";
  await supabase.from("pedidos").update({ estado_pago: nuevoEstado }).eq("id", a.pedidoId);

  const clienteId = (pedido as { cliente_id: string | null }).cliente_id;
  if (clienteId) revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function marcarMensajeLeido(id: string, leido: boolean): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mensajes").update({ leido }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el mensaje." };
  revalidatePath("/admin/mensajes");
  return { ok: true };
}

export async function eliminarMensaje(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mensajes").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el mensaje." };
  revalidatePath("/admin/mensajes");
  return { ok: true };
}

// ── Producción · Insumos (Fase B) ───────────────────────────────────────────
const produccionSchema = z.object({
  slug: z.string().min(1),
  ml: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  nota: z.string().trim().optional(),
});

export async function registrarProduccion(input: z.infer<typeof produccionSchema>): Promise<ActionResult> {
  const parsed = produccionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de producción inválidos." };
  const p = parsed.data;
  const user = await getAdminUser();
  if (!user?.email) return { ok: false, error: "Sesión no válida." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("registrar_produccion", {
    p_slug: p.slug,
    p_ml: p.ml,
    p_cantidad: p.cantidad,
    p_vendedor_email: user.email,
    p_nota: p.nota || null,
  });
  if (error) return { ok: false, error: "No se pudo registrar la producción." };

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  return { ok: true };
}

const compraInsumoSchema = z.object({
  insumo: z.string().trim().min(1),
  cantidad: z.number().positive(),
  unidad: z.string().trim().min(1),
  costoCop: z.number().int().nonnegative(),
  proveedor: z.string().trim().optional(),
});

export async function registrarCompraInsumo(input: z.infer<typeof compraInsumoSchema>): Promise<ActionResult> {
  const parsed = compraInsumoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de la compra inválidos." };
  const c = parsed.data;
  const user = await getAdminUser();
  if (!user?.email) return { ok: false, error: "Sesión no válida." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("insumos_compras").insert({
    insumo: c.insumo,
    cantidad: c.cantidad,
    unidad: c.unidad,
    costo_cop: c.costoCop,
    proveedor: c.proveedor || null,
    vendedor_email: user.email,
  });
  if (error) return { ok: false, error: "No se pudo registrar la compra." };

  revalidatePath("/admin/insumos");
  return { ok: true };
}

// ── Recetas (Fase C) ────────────────────────────────────────────────────────
const recetaItemSchema = z.object({
  slug: z.string().min(1),
  ml: z.number().int().positive(),
  insumo: z.string().trim().min(1),
  cantidadPorUnidad: z.number().positive(),
  unidad: z.string().trim().min(1),
});

export async function guardarRecetaItem(input: z.infer<typeof recetaItemSchema>): Promise<ActionResult> {
  const parsed = recetaItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de la receta inválidos." };
  const r = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("recetas").upsert(
    { slug: r.slug, ml: r.ml, insumo: r.insumo, cantidad_por_unidad: r.cantidadPorUnidad, unidad: r.unidad },
    { onConflict: "slug,ml,insumo" },
  );
  if (error) return { ok: false, error: "No se pudo guardar la receta." };
  revalidatePath("/admin/recetas");
  revalidatePath("/admin/auditoria");
  return { ok: true };
}

export async function eliminarRecetaItem(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("recetas").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el insumo de la receta." };
  revalidatePath("/admin/recetas");
  revalidatePath("/admin/auditoria");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
