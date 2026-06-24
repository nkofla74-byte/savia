-- Agrega admin@savia.co a la lista de administradores autorizados del panel.
-- Idempotente: re-ejecutable sin error.
insert into public.admins (email) values ('admin@savia.co')
on conflict (email) do nothing;
