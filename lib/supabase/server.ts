import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Cliente de servidor para usar dentro de Server Actions. Usa la anon key; la
// escritura está restringida por RLS (solo INSERT permitido para el rol anónimo).
export function getSupabaseServer() {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
