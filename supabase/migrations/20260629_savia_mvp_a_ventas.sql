-- Savia — MVP POS · Fase A: Ventas + Clientes + Abonos.
-- Unifica ventas internas (POS) en la tabla pedidos existente (origen='pos').
-- - clientes: tabla real (antes derivada de pedidos por teléfono).
-- - abonos: ledger de pagos; saldo = total - Σ abonos (fuente de verdad del dinero).
-- - inventario: reestructurado a (slug, ml) para stock por presentación.
-- - registrar_venta(): RPC transaccional (pedido + items + descuento de stock + abono).
-- Nota: pedidos/pedido_items están vacíos → reestructuración sin migración de datos.

-- ── clientes (tabla real) ──────────────────────────────────────────────────
create table if not exists public.clientes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nombre        text not null,
  telefono      text not null unique,
  direccion     text,
  observaciones text
);

alter table public.clientes enable row level security;
create policy "admin lee clientes" on public.clientes
  for select to authenticated using ((select public.is_admin()));
create policy "admin inserta clientes" on public.clientes
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin act. clientes" on public.clientes
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra clientes" on public.clientes
  for delete to authenticated using ((select public.is_admin()));
grant select, insert, update, delete on public.clientes to authenticated;

-- ── pedidos: columnas para ventas POS unificadas ───────────────────────────
alter table public.pedidos
  add column if not exists origen        text not null default 'web',
  add column if not exists cliente_id    uuid references public.clientes(id),
  add column if not exists vendedor_email text;

alter table public.pedidos drop constraint if exists pedidos_origen_check;
alter table public.pedidos add constraint pedidos_origen_check
  check (origen in ('web','pos'));

-- Campos de envío web: opcionales para ventas POS de mostrador.
alter table public.pedidos alter column departamento drop not null;
alter table public.pedidos alter column ciudad drop not null;
alter table public.pedidos alter column direccion drop not null;

-- Ampliar estado_pago para incluir el modelo POS (pagado/abono).
alter table public.pedidos drop constraint if exists pedidos_estado_pago_check;
alter table public.pedidos add constraint pedidos_estado_pago_check
  check (estado_pago in ('pendiente','aprobado','rechazado','error','pagado','abono'));

create index if not exists pedidos_cliente_id_idx on public.pedidos (cliente_id);
create index if not exists pedidos_origen_idx on public.pedidos (origen);

-- ── pedido_items: presentación vendida (para descontar el stock correcto) ──
alter table public.pedido_items add column if not exists ml integer;

-- ── abonos (ledger de pagos) ───────────────────────────────────────────────
create table if not exists public.abonos (
  id             uuid primary key default gen_random_uuid(),
  pedido_id      uuid not null references public.pedidos(id) on delete cascade,
  monto_cop      integer not null check (monto_cop > 0),
  metodo_pago    text not null default 'efectivo',
  vendedor_email text,
  fecha          timestamptz not null default now(),
  nota           text
);
create index if not exists abonos_pedido_id_idx on public.abonos (pedido_id);

alter table public.abonos enable row level security;
create policy "admin lee abonos" on public.abonos
  for select to authenticated using ((select public.is_admin()));
create policy "admin inserta abonos" on public.abonos
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin act. abonos" on public.abonos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra abonos" on public.abonos
  for delete to authenticated using ((select public.is_admin()));
grant select, insert, update, delete on public.abonos to authenticated;

-- ── inventario: reestructurar a (slug, ml) — stock por presentación ────────
drop table if exists public.inventario cascade;
create table public.inventario (
  slug       text not null,
  ml         integer not null,
  stock      integer not null default 0,   -- puede ser negativo: señal de producir
  updated_at timestamptz not null default now(),
  primary key (slug, ml)
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

-- Seed por (slug, ml). 7 productos de un solo tamaño + 8 aceites solos × (30/60/100).
insert into public.inventario (slug, ml, stock) values
  ('calma', 100, 10), ('despierta', 100, 10), ('cacao', 100, 10),
  ('frescor', 100, 10), ('raiz', 100, 10), ('luz', 30, 10), ('rocio-de-rosas', 200, 10),
  ('cafe', 30, 10), ('cafe', 60, 10), ('cafe', 100, 10),
  ('chocolate', 30, 10), ('chocolate', 60, 10), ('chocolate', 100, 10),
  ('cacao-puro', 30, 10), ('cacao-puro', 60, 10), ('cacao-puro', 100, 10),
  ('naranja', 30, 10), ('naranja', 60, 10), ('naranja', 100, 10),
  ('menta', 30, 10), ('menta', 60, 10), ('menta', 100, 10),
  ('almendras', 30, 10), ('almendras', 60, 10), ('almendras', 100, 10),
  ('coco', 30, 10), ('coco', 60, 10), ('coco', 100, 10),
  ('uva', 30, 10), ('uva', 60, 10), ('uva', 100, 10)
on conflict (slug, ml) do nothing;

-- ── registrar_venta(): venta POS transaccional ─────────────────────────────
-- p_items: jsonb array de {slug, ml, nombre, precio_cop, qty}
create or replace function public.registrar_venta(
  p_cliente_id     uuid,
  p_vendedor_email text,
  p_items          jsonb,
  p_metodo_pago    text,
  p_estado_pago    text,     -- pagado | abono | pendiente
  p_monto_abonado  integer,  -- solo si abono
  p_estado_pedido  text      -- pendiente | entregado
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido_id uuid;
  v_subtotal  integer;
  v_cliente   public.clientes%rowtype;
  v_item      jsonb;
  v_estado    text;
  v_abono     integer;
begin
  if not public.is_admin() then
    raise exception 'no autorizado';
  end if;

  select * into v_cliente from public.clientes where id = p_cliente_id;
  if not found then
    raise exception 'cliente no existe';
  end if;

  select coalesce(sum((i->>'precio_cop')::int * (i->>'qty')::int), 0)
    into v_subtotal
  from jsonb_array_elements(p_items) i;

  if v_subtotal <= 0 then
    raise exception 'venta sin productos';
  end if;

  if p_estado_pago not in ('pagado','abono','pendiente') then
    raise exception 'estado_pago inválido: %', p_estado_pago;
  end if;

  v_estado := case when p_estado_pedido = 'entregado' then 'entregado' else 'nuevo' end;

  insert into public.pedidos (
    referencia, nombre, telefono, direccion,
    subtotal_cop, envio_cop, total_cop,
    estado, metodo_pago, estado_pago, origen, cliente_id, vendedor_email
  ) values (
    'POS-' || to_char(now(), 'YYMMDD-HH24MISS'),
    v_cliente.nombre, v_cliente.telefono, v_cliente.direccion,
    v_subtotal, 0, v_subtotal,
    v_estado, 'manual', p_estado_pago, 'pos', p_cliente_id, p_vendedor_email
  ) returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.pedido_items (pedido_id, slug, ml, nombre, precio_cop, qty)
    values (
      v_pedido_id, v_item->>'slug', (v_item->>'ml')::int, v_item->>'nombre',
      (v_item->>'precio_cop')::int, (v_item->>'qty')::int
    );

    update public.inventario
      set stock = stock - (v_item->>'qty')::int, updated_at = now()
      where slug = v_item->>'slug' and ml = (v_item->>'ml')::int;
  end loop;

  if p_estado_pago = 'pagado' then
    v_abono := v_subtotal;
  elsif p_estado_pago = 'abono' then
    v_abono := coalesce(p_monto_abonado, 0);
  else
    v_abono := 0;
  end if;

  if v_abono > 0 then
    insert into public.abonos (pedido_id, monto_cop, metodo_pago, vendedor_email)
    values (v_pedido_id, v_abono, p_metodo_pago, p_vendedor_email);
  end if;

  return v_pedido_id;
end;
$$;

revoke all on function public.registrar_venta(uuid,text,jsonb,text,text,integer,text) from public;
grant execute on function public.registrar_venta(uuid,text,jsonb,text,text,integer,text) to authenticated;
