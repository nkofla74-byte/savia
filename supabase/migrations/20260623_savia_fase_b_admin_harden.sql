-- Fase B (hardening): cierra el advisor de seguridad sobre is_admin().
-- is_admin() es SECURITY DEFINER y sólo se usa como helper dentro de las
-- políticas RLS (todas `to authenticated`). No debe ser invocable por anon
-- vía /rest/v1/rpc/is_admin.
--
-- Nota: revocar EXECUTE a `authenticated` rompería la evaluación de las
-- políticas RLS (ERROR: permission denied for function is_admin), por eso se
-- conserva el grant a authenticated y sólo se cierra para anon/PUBLIC.

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.is_admin() from anon;
