"use server";
import { contactoSchema, type ContactoInput } from "./schema";
import { getSupabaseServer } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function enviarMensaje(input: ContactoInput): Promise<ActionResult> {
  const parsed = contactoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { nombre, telefono, email, asunto, mensaje } = parsed.data;
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("mensajes").insert({
    nombre,
    telefono,
    email: email || null,
    asunto,
    mensaje,
  });

  if (error) return { ok: false, error: "No se pudo guardar el mensaje. Intenta de nuevo." };
  return { ok: true };
}
