-- Savia — Fase A: tablas de formularios (contacto + pedido nacional) con RLS.
-- Seguridad: RLS habilitada; el rol anónimo SOLO puede INSERT. La lectura y
-- gestión se habilitarán en la Fase B (panel admin con Supabase Auth).

-- ── mensajes (formulario de contacto) ──────────────────────────────────────
create table if not exists public.mensajes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nombre      text not null,
  email       text,
  telefono    text not null,
  asunto      text not null,
  mensaje     text not null
);

alter table public.mensajes enable row level security;

create policy "anon puede insertar mensajes"
  on public.mensajes for insert
  to anon
  with check (true);

-- ── pedidos (pedido con envío nacional) ────────────────────────────────────
create table if not exists public.pedidos (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  referencia    text not null,
  nombre        text not null,
  telefono      text not null,
  email         text,
  departamento  text not null,
  ciudad        text not null,
  direccion     text not null,
  notas         text,
  subtotal_cop  integer not null check (subtotal_cop > 0),
  estado        text not null default 'nuevo'
                check (estado in ('nuevo','confirmado','enviado','entregado','cancelado'))
);

alter table public.pedidos enable row level security;

create policy "anon puede insertar pedidos"
  on public.pedidos for insert
  to anon
  with check (true);

-- ── pedido_items ───────────────────────────────────────────────────────────
create table if not exists public.pedido_items (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references public.pedidos(id) on delete cascade,
  slug        text not null,
  nombre      text not null,
  precio_cop  integer not null check (precio_cop > 0),
  qty         integer not null check (qty > 0)
);

alter table public.pedido_items enable row level security;

create policy "anon puede insertar pedido_items"
  on public.pedido_items for insert
  to anon
  with check (true);

create index if not exists pedido_items_pedido_id_idx on public.pedido_items (pedido_id);
