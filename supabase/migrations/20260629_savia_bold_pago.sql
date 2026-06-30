-- Savia — Pasarela Bold (Link de pago): permite metodo_pago='bold',
-- agrega columna del id de transacción de Bold y actualiza la policy de INSERT anónimo.

-- 1) Permitir 'bold' en metodo_pago (se mantiene 'wompi' para filas históricas).
alter table public.pedidos drop constraint if exists pedidos_metodo_pago_check;
alter table public.pedidos add constraint pedidos_metodo_pago_check
  check (metodo_pago in ('manual','wompi','bold'));

-- 2) Columna para el id de transacción de Bold.
alter table public.pedidos
  add column if not exists bold_payment_id text;

-- 3) La policy de INSERT anónimo debe permitir 'bold'.
drop policy if exists "anon inserta pedidos pendientes" on public.pedidos;
create policy "anon inserta pedidos pendientes"
  on public.pedidos for insert
  to anon
  with check (
    estado = 'nuevo'
    and estado_pago = 'pendiente'
    and metodo_pago in ('manual','wompi','bold')
  );
