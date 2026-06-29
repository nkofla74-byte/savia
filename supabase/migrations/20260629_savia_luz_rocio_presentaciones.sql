-- Savia — Luz (sérum) y Rocío de Rosas (tónico) también pasan a 30/60/100 ml,
-- unificando TODO el catálogo. Se agregan filas de inventario faltantes y se
-- limpia la fila huérfana de 200 ml de Rocío (ya no es una presentación válida).

insert into public.inventario (slug, ml, stock) values
  ('luz', 60, 10), ('luz', 100, 10),
  ('rocio-de-rosas', 30, 10), ('rocio-de-rosas', 60, 10), ('rocio-de-rosas', 100, 10)
on conflict (slug, ml) do nothing;

delete from public.inventario where slug = 'rocio-de-rosas' and ml = 200;
