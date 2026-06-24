import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import type { User } from "@supabase/supabase-js";

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase.from("admins").select("email").eq("email", user.email).maybeSingle();
  return data ? user : null;
}
