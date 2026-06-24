-- Fase B: autorización de admin + RLS de gestión.

create table if not exists public.admins ( email text primary key );
alter table public.admins enable row level security;

-- el admin puede ver su propia fila (para verificar en la app)
create policy "admin ve su propia fila" on public.admins
  for select to authenticated using (email = auth.jwt() ->> 'email');

-- correo del admin (PLACEHOLDER — reemplazar por el real)
insert into public.admins (email) values ('CORREO_ADMIN_PLACEHOLDER')
  on conflict do nothing;

create or replace function public.is_admin() returns boolean
  language sql security definer stable
  set search_path = public as $$
    select exists (select 1 from public.admins a where a.email = auth.jwt() ->> 'email');
  $$;

alter table public.mensajes add column if not exists leido boolean not null default false;

-- is_admin() envuelto en (select …) para que se evalúe una vez por query
-- (best practice de rendimiento de Supabase, evita reevaluación por fila).
create policy "admin lee mensajes"   on public.mensajes     for select to authenticated using ((select public.is_admin()));
create policy "admin act. mensajes"  on public.mensajes     for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra mensajes" on public.mensajes     for delete to authenticated using ((select public.is_admin()));
create policy "admin lee pedidos"    on public.pedidos      for select to authenticated using ((select public.is_admin()));
create policy "admin act. pedidos"   on public.pedidos      for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra pedidos"  on public.pedidos      for delete to authenticated using ((select public.is_admin()));
create policy "admin lee items"      on public.pedido_items for select to authenticated using ((select public.is_admin()));
create policy "admin borra items"    on public.pedido_items for delete to authenticated using ((select public.is_admin()));
