-- Amplía el flujo de estados de pedido a un proceso real de fulfillment.
-- Mantiene los estados existentes (nuevo, confirmado, enviado, entregado, cancelado)
-- por compatibilidad y agrega: preparando, empacado, finalizado.

alter table public.pedidos drop constraint if exists pedidos_estado_check;

alter table public.pedidos add constraint pedidos_estado_check
  check (estado in (
    'nuevo',
    'confirmado',
    'preparando',
    'empacado',
    'enviado',
    'entregado',
    'finalizado',
    'cancelado'
  ));
