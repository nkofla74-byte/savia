-- Fase B (rendimiento, advisor 0003): la política de auto-lectura de `admins`
-- reevaluaba auth.jwt() por fila. Se envuelve en (select …) para evaluarla una
-- sola vez por query (mismo patrón ya usado en las políticas de is_admin()).

drop policy if exists "admin ve su propia fila" on public.admins;
create policy "admin ve su propia fila" on public.admins
  for select to authenticated using (email = (select auth.jwt() ->> 'email'));
