-- Savia — MVP POS · Fase C: Recetas (BOM) para auditoría.
-- Una receta define, por presentación (slug, ml), cuánto insumo consume cada unidad.
-- La auditoría es 100% derivada (compras vs producción × receta); no hay tablas extra.

create table if not exists public.recetas (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null,
  ml                  integer not null,
  insumo              text not null,
  cantidad_por_unidad numeric not null check (cantidad_por_unidad > 0),
  unidad              text not null,
  unique (slug, ml, insumo)
);
create index if not exists recetas_slug_ml_idx on public.recetas (slug, ml);

alter table public.recetas enable row level security;
create policy "admin lee recetas" on public.recetas
  for select to authenticated using ((select public.is_admin()));
create policy "admin inserta recetas" on public.recetas
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin act. recetas" on public.recetas
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra recetas" on public.recetas
  for delete to authenticated using ((select public.is_admin()));
grant select, insert, update, delete on public.recetas to authenticated;
