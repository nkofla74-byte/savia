-- Savia — MVP POS · Fase B: Producción de terminados + Compras de insumos.
-- - producciones: registra lo producido; sube el stock del terminado.
-- - insumos_compras: SOLO log de compras de materia prima (no lleva stock propio).
-- - registrar_produccion(): RPC transaccional (registro + incremento de inventario).

-- ── producciones ────────────────────────────────────────────────────────────
create table if not exists public.producciones (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null,
  ml             integer not null,
  cantidad       integer not null check (cantidad > 0),
  vendedor_email text,
  nota           text,
  fecha          timestamptz not null default now()
);
create index if not exists producciones_slug_ml_idx on public.producciones (slug, ml);
create index if not exists producciones_fecha_idx on public.producciones (fecha);

alter table public.producciones enable row level security;
create policy "admin lee producciones" on public.producciones
  for select to authenticated using ((select public.is_admin()));
create policy "admin inserta producciones" on public.producciones
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin borra producciones" on public.producciones
  for delete to authenticated using ((select public.is_admin()));
grant select, insert, delete on public.producciones to authenticated;

-- ── insumos_compras ─────────────────────────────────────────────────────────
create table if not exists public.insumos_compras (
  id             uuid primary key default gen_random_uuid(),
  insumo         text not null,
  cantidad       numeric not null check (cantidad > 0),
  unidad         text not null,
  costo_cop      integer not null check (costo_cop >= 0),
  proveedor      text,
  vendedor_email text,
  fecha          timestamptz not null default now()
);
create index if not exists insumos_compras_insumo_idx on public.insumos_compras (insumo);
create index if not exists insumos_compras_fecha_idx on public.insumos_compras (fecha);

alter table public.insumos_compras enable row level security;
create policy "admin lee insumos" on public.insumos_compras
  for select to authenticated using ((select public.is_admin()));
create policy "admin inserta insumos" on public.insumos_compras
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin borra insumos" on public.insumos_compras
  for delete to authenticated using ((select public.is_admin()));
grant select, insert, delete on public.insumos_compras to authenticated;

-- ── registrar_produccion(): sube stock del terminado ───────────────────────
create or replace function public.registrar_produccion(
  p_slug           text,
  p_ml             integer,
  p_cantidad       integer,
  p_vendedor_email text,
  p_nota           text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'no autorizado';
  end if;
  if p_cantidad <= 0 then
    raise exception 'cantidad inválida';
  end if;

  insert into public.producciones (slug, ml, cantidad, vendedor_email, nota)
  values (p_slug, p_ml, p_cantidad, p_vendedor_email, p_nota)
  returning id into v_id;

  insert into public.inventario (slug, ml, stock, updated_at)
  values (p_slug, p_ml, p_cantidad, now())
  on conflict (slug, ml)
  do update set stock = public.inventario.stock + excluded.stock, updated_at = now();

  return v_id;
end;
$$;

revoke all on function public.registrar_produccion(text,integer,integer,text,text) from public;
grant execute on function public.registrar_produccion(text,integer,integer,text,text) to authenticated;
