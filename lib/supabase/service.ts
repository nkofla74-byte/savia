import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Cliente con service-role: SALTA RLS. Importar SOLO en código de servidor
// (webhook de Wompi, lecturas de estado en server components). Nunca exponer
// al cliente ni usar la service key en componentes con "use client".
export function getSupabaseService() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
