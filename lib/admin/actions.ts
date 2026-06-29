"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { esEstadoValido } from "./estados";

export type ActionResult = { ok: true } | { ok: false; error: string };

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

export async function actualizarStock(slug: string, stock: number): Promise<ActionResult> {
  if (!Number.isInteger(stock) || stock < 0) return { ok: false, error: "Stock inválido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("inventario")
    .upsert({ slug, stock, updated_at: new Date().toISOString() }, { onConflict: "slug" });
  if (error) return { ok: false, error: "No se pudo actualizar el stock." };
  revalidatePath("/admin/inventario");
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

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
