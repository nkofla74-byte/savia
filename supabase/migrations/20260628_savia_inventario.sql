-- Inventario operacional por producto (keyed por slug del catálogo en content/products.ts).
-- No mueve el catálogo a BD: solo registra stock para el panel admin.

create table if not exists public.inventario (
  slug text primary key,
  stock integer not null default 0 check (stock >= 0),
  updated_at timestamptz not null default now()
);

alter table public.inventario enable row level security;

create policy "admin lee inventario" on public.inventario
  for select to authenticated using ((select public.is_admin()));
create policy "admin inserta inventario" on public.inventario
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin act. inventario" on public.inventario
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra inventario" on public.inventario
  for delete to authenticated using ((select public.is_admin()));

grant select, insert, update, delete on public.inventario to authenticated;

-- Seed con stock inicial para los slugs actuales del catálogo.
insert into public.inventario (slug, stock) values
  ('calma', 10), ('despierta', 10), ('cacao', 10), ('frescor', 10), ('raiz', 10),
  ('luz', 10), ('rocio-de-rosas', 10), ('cafe', 10), ('chocolate', 10), ('cacao-puro', 10),
  ('naranja', 10), ('menta', 10), ('almendras', 10), ('coco', 10), ('uva', 10)
on conflict (slug) do nothing;
