-- Endurece las políticas de INSERT: reemplaza WITH CHECK (true) por límites
-- razonables de longitud/valor (anti-abuso) y fuerza estado='nuevo' en pedidos.

drop policy if exists "anon puede insertar mensajes" on public.mensajes;
create policy "anon puede insertar mensajes"
  on public.mensajes for insert to anon
  with check (
    char_length(nombre) between 2 and 120
    and char_length(telefono) between 7 and 30
    and char_length(asunto) between 2 and 160
    and char_length(mensaje) between 5 and 4000
    and (email is null or char_length(email) <= 200)
  );

drop policy if exists "anon puede insertar pedidos" on public.pedidos;
create policy "anon puede insertar pedidos"
  on public.pedidos for insert to anon
  with check (
    char_length(referencia) between 4 and 30
    and char_length(nombre) between 2 and 120
    and char_length(telefono) between 7 and 30
    and char_length(departamento) between 2 and 60
    and char_length(ciudad) between 2 and 120
    and char_length(direccion) between 4 and 300
    and (email is null or char_length(email) <= 200)
    and subtotal_cop > 0 and subtotal_cop < 100000000
    and estado = 'nuevo'
  );

drop policy if exists "anon puede insertar pedido_items" on public.pedido_items;
create policy "anon puede insertar pedido_items"
  on public.pedido_items for insert to anon
  with check (
    char_length(slug) between 1 and 80
    and char_length(nombre) between 1 and 200
    and precio_cop > 0 and precio_cop < 100000000
    and qty > 0 and qty <= 1000
  );
