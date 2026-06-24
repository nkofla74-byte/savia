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
