# Savia — Backend con Supabase, Fase B: Panel admin (diseño)

**Fecha:** 2026-06-23
**Estado:** Aprobado — listo para plan de implementación

## Objetivo

Construir un panel de administración protegido (`/admin`) donde la dueña, tras
autenticarse con **magic link**, pueda **ver y gestionar** los registros creados
en la Fase A:

- **Pedidos**: listar (con productos y datos de envío), buscar por
  referencia/nombre, filtrar por estado, cambiar el estado y eliminar.
- **Mensajes** (contacto): listar, marcar como leído, filtrar leído/no leído y
  eliminar.

Depende de la Fase A (tablas `mensajes`, `pedidos`, `pedido_items` ya existen
con RLS solo-INSERT para anónimos).

## Arquitectura

- **Supabase Auth** con magic link (`signInWithOtp`, `type: magiclink`). Sesión
  persistida en cookies con `@supabase/ssr` (patrón estándar de Next.js App
  Router: cliente de navegador + cliente de servidor con cookies + middleware).
- **Autorización por allowlist:** tabla `admins(email)`. Una función SQL
  `is_admin()` evalúa si el email del JWT está en `admins`.
- **RLS como fuente de verdad:** las lecturas y mutaciones del admin pasan por el
  cliente con la sesión del usuario (rol `authenticated`); las políticas otorgan
  `SELECT/UPDATE/DELETE` solo cuando `is_admin()` es verdadero. Aunque cualquiera
  solicite un magic link y obtenga sesión, sin estar en `admins` no accede a
  ningún dato.
- **Middleware** (`middleware.ts`): refresca la sesión y protege `/admin/*`
  (excepto `/admin/login` y la callback). Sin sesión o sin ser admin → redirige a
  `/admin/login`. El middleware es UX/primera barrera; RLS es la barrera real.

## Cambios en base de datos (migración Fase B)

```sql
create table public.admins ( email text primary key );
alter table public.admins enable row level security;
-- (sin políticas para anon; sólo service_role/admin podrán consultarla)

-- email del admin (placeholder — reemplazar por el real)
insert into public.admins (email) values ('CORREO_ADMIN_PLACEHOLDER')
  on conflict do nothing;

create or replace function public.is_admin() returns boolean
  language sql security definer stable as $$
    select exists (select 1 from public.admins a where a.email = auth.jwt() ->> 'email');
  $$;

alter table public.mensajes add column if not exists leido boolean not null default false;

-- políticas de admin (authenticated + is_admin())
create policy "admin lee mensajes"   on public.mensajes     for select to authenticated using (public.is_admin());
create policy "admin act. mensajes"  on public.mensajes     for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin borra mensajes" on public.mensajes     for delete to authenticated using (public.is_admin());
create policy "admin lee pedidos"    on public.pedidos      for select to authenticated using (public.is_admin());
create policy "admin act. pedidos"   on public.pedidos      for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin borra pedidos"  on public.pedidos      for delete to authenticated using (public.is_admin());
create policy "admin lee items"      on public.pedido_items for select to authenticated using (public.is_admin());
create policy "admin borra items"    on public.pedido_items for delete to authenticated using (public.is_admin());
```

Los INSERT públicos de la Fase A se conservan. La eliminación de un pedido
arrastra sus `pedido_items` por el `on delete cascade`.

## Variables de entorno

Reutiliza `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La URL de
redirección del magic link usa `NEXT_PUBLIC_SITE_URL` (ya existe) para construir
`${SITE_URL}/admin/auth/callback`.

## Dependencias nuevas

- `@supabase/ssr`.

## Componentes y archivos

### Supabase clients (cookies)

- `lib/supabase/client.ts` — `createBrowserClient` (para el login en cliente).
- `lib/supabase/server-ssr.ts` — `createServerClient` con `cookies()` de Next,
  para Server Components / Server Actions con la sesión del usuario.
- `lib/supabase/middleware.ts` — helper `updateSession(request)` para refrescar
  cookies en el middleware.
- `lib/supabase/server.ts` (existente, anon sin sesión) se mantiene para las
  Server Actions públicas de la Fase A.

### Middleware y auth

- `middleware.ts` (raíz) — llama `updateSession` y, para rutas `/admin` (salvo
  `/admin/login` y `/admin/auth/callback`), redirige a login si no hay sesión.
- `lib/admin/auth.ts` — `getAdminSession()`: devuelve el usuario si hay sesión y
  es admin (`is_admin` comprobado vía consulta), o `null`.
- `app/admin/login/page.tsx` — formulario de un campo (correo) que llama
  `signInWithOtp` con `emailRedirectTo` a la callback. Muestra "revisa tu correo".
- `app/admin/auth/callback/route.ts` — `exchangeCodeForSession`, luego redirige a
  `/admin`.

### Layout y vistas del panel

- `app/admin/layout.tsx` — Server Component: verifica `getAdminSession()`; si no
  es admin, redirige a `/admin/login`. Renderiza nav (Pedidos, Mensajes) +
  botón "Cerrar sesión" (Server Action `signOut`).
- `app/admin/page.tsx` — resumen: conteo de pedidos por estado, mensajes no
  leídos, y últimos registros.
- `app/admin/pedidos/page.tsx` — tabla/lista de pedidos con sus `pedido_items`,
  datos de envío y total. Búsqueda (referencia/nombre) y filtro por estado vía
  query params (`?q=&estado=`). Acciones: cambiar estado (select que dispara
  Server Action) y eliminar (con confirmación).
- `app/admin/mensajes/page.tsx` — lista de mensajes; filtro leído/no leído;
  acciones: marcar leído/no leído y eliminar.

### Capa de datos

- `lib/admin/queries.ts` — funciones de lectura (con `server-ssr`): `getPedidos`
  (con filtros), `getPedido(id)` con items, `getMensajes` (con filtro),
  `getResumen` (conteos). Aplican RLS por sesión.
- `lib/admin/actions.ts` — Server Actions: `cambiarEstadoPedido(id, estado)`
  (valida `estado` contra el enum), `eliminarPedido(id)`,
  `marcarMensajeLeido(id, leido)`, `eliminarMensaje(id)`, `signOut()`.
- `lib/admin/estados.ts` — `ESTADOS = ['nuevo','confirmado','enviado','entregado','cancelado']`
  y helpers puros (etiqueta + validación). **Con test.**

## Flujo de datos

```
Login:  /admin/login → signInWithOtp(email, redirect=/admin/auth/callback)
        → correo con enlace → callback exchangeCodeForSession → sesión en cookies
        → /admin (layout verifica is_admin)

Gestión: vista server (queries con sesión, RLS filtra) → acción (Server Action
         con sesión) → update/delete (RLS exige is_admin) → revalidatePath
```

## Manejo de errores

- Login: email inválido → mensaje en el formulario; éxito → "revisa tu correo".
- Acceso no autorizado (sesión pero no admin): el layout redirige a `/admin/login`
  con un aviso; RLS además no devolvería datos.
- Server Actions devuelven `Result` y la vista revalida (`revalidatePath`) tras
  éxito; ante error muestran mensaje.

## Testing

- `lib/admin/estados.ts`: valida estados conocidos, rechaza desconocidos,
  etiquetas correctas. (Vitest, TDD.)
- Helpers puros de filtro/normalización de query params, si los hay.
- Auth, RLS y vistas: verificación manual (login, ver/gestionar, y que un correo
  no-admin no ve datos) + `get_advisors` de Supabase tras la migración.
- Verificación final: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Seguridad

- RLS admin-only (`is_admin()`) como barrera real; middleware como primera capa.
- `admins` sin políticas para anon → no se puede enumerar.
- Borrados con confirmación explícita en la UI.
- `is_admin()` es `security definer` y `stable`, sólo lee `admins`.

## Fuera de alcance

- Roles múltiples / permisos granulares.
- Notificaciones por correo de nuevos pedidos.
- Auditoría/historial de cambios de estado.
