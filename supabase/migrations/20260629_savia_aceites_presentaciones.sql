-- Savia — Aceites unificados a presentaciones 30/60/100 ml.
-- Calma, Despierta, Cacao, Frescor y Raíz pasan de un solo tamaño (100 ml) a
-- las 3 presentaciones (igual que los demás aceites). Se agregan las filas de
-- inventario faltantes (30 y 60 ml); la de 100 ml ya existe.

insert into public.inventario (slug, ml, stock) values
  ('calma', 30, 10), ('calma', 60, 10),
  ('despierta', 30, 10), ('despierta', 60, 10),
  ('cacao', 30, 10), ('cacao', 60, 10),
  ('frescor', 30, 10), ('frescor', 60, 10),
  ('raiz', 30, 10), ('raiz', 60, 10)
on conflict (slug, ml) do nothing;
