-- Savia — Pago online con Wompi: columnas de pago en pedidos + RLS endurecida.

alter table public.pedidos
  add column if not exists metodo_pago text not null default 'manual'
    check (metodo_pago in ('manual','wompi')),
  add column if not exists estado_pago text not null default 'pendiente'
    check (estado_pago in ('pendiente','aprobado','rechazado','error')),
  add column if not exists wompi_transaction_id text,
  add column if not exists envio_cop integer not null default 0
    check (envio_cop >= 0),
  add column if not exists total_cop integer
    check (total_cop is null or total_cop > 0);

-- Endurecer el INSERT anónimo: nadie puede insertar un pedido ya "aprobado".
-- Solo el webhook (service-role, salta RLS) puede marcar estado_pago='aprobado'.
drop policy if exists "anon puede insertar pedidos" on public.pedidos;

create policy "anon inserta pedidos pendientes"
  on public.pedidos for insert
  to anon
  with check (
    estado = 'nuevo'
    and estado_pago = 'pendiente'
    and metodo_pago in ('manual','wompi')
  );
