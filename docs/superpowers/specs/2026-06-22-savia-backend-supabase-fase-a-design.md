# Savia — Backend con Supabase, Fase A: Formularios (diseño)

**Fecha:** 2026-06-22
**Estado:** Aprobado — listo para plan de implementación

## Objetivo

Introducir un backend con Supabase para persistir dos formularios y, en paralelo,
abrir WhatsApp con el resumen:

1. **Contacto** (`/contacto`) — mensajes de clientes.
2. **Pedido con envío nacional** (`/pedido`) — pedido completo con dirección de
   envío a cualquier parte de Colombia, a partir del carrito.

Es la **Fase A**. El panel de administración (login + ver/gestionar registros)
es la **Fase B**, en un spec aparte. Mientras tanto, la dueña revisa los
registros en el dashboard de Supabase.

## Arquitectura

- **Supabase** (Postgres + RLS) como backend. Proyecto nuevo dedicado: `savia`.
- Envíos vía **Server Actions de Next.js** (no API routes). Cada acción:
  valida con zod en el servidor, inserta en Supabase y devuelve un `Result`.
  El cliente, ante éxito, abre WhatsApp con el resumen.
- El sitio deja de ser 100% estático en `/contacto` y `/pedido` (usan runtime de
  servidor por las Server Actions). El resto sigue estático/SSG.
- **Cliente Supabase de servidor**: usa la *anon/publishable key*, leída de env
  vars. Las Server Actions corren en el servidor, así que la key no se expone en
  el bundle del cliente.

### Variables de entorno (nuevas)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Se documentan en `.env.example`. Los valores reales provienen del proyecto
`savia` creado en Supabase.

## Seguridad (RLS)

- RLS habilitada en las tres tablas.
- Política que permite **solo `INSERT`** al rol `anon` en `mensajes`, `pedidos`
  y `pedido_items`.
- Sin políticas de `SELECT`/`UPDATE`/`DELETE` para `anon` → el cliente no puede
  leer ni modificar datos. La lectura/gestión llegará en la Fase B mediante
  Supabase Auth (rol autenticado del admin) o `service_role`.
- La validación de forma y contenido se hace en la Server Action con zod antes
  de insertar.

## Modelo de datos

### `mensajes` (contacto)

| columna     | tipo          | notas                          |
|-------------|---------------|--------------------------------|
| id          | uuid          | PK, `gen_random_uuid()`        |
| created_at  | timestamptz   | default `now()`                |
| nombre      | text          | not null                       |
| email       | text          | nullable                       |
| telefono    | text          | not null                       |
| mensaje     | text          | not null                       |

### `pedidos` (pedido nacional)

| columna       | tipo        | notas                                   |
|---------------|-------------|-----------------------------------------|
| id            | uuid        | PK, `gen_random_uuid()`                 |
| created_at    | timestamptz | default `now()`                         |
| referencia    | text        | not null (formato `SAVIA-XXXX`)         |
| nombre        | text        | not null                                |
| telefono      | text        | not null                                |
| email         | text        | nullable                                |
| departamento  | text        | not null                                |
| ciudad        | text        | not null                                |
| direccion     | text        | not null                                |
| notas         | text        | nullable                                |
| subtotal_cop  | integer     | not null, > 0                           |
| estado        | text        | not null, default `'nuevo'`             |

`estado` admite: `nuevo`, `confirmado`, `enviado`, `entregado`, `cancelado`
(validado por CHECK).

### `pedido_items`

| columna     | tipo     | notas                                       |
|-------------|----------|---------------------------------------------|
| id          | uuid     | PK, `gen_random_uuid()`                      |
| pedido_id   | uuid     | FK → `pedidos(id)` ON DELETE CASCADE, not null |
| slug        | text     | not null                                    |
| nombre      | text     | not null                                    |
| precio_cop  | integer  | not null, > 0                               |
| qty         | integer  | not null, > 0                               |

## Componentes y archivos

### Datos / utilidades

- `content/colombia.ts` — lista de los 32 departamentos + `Bogotá D.C.` como
  `const DEPARTAMENTOS: readonly string[]`. Con test (existe, sin duplicados,
  contiene Bogotá D.C. y 33 entradas).
- `lib/supabase/server.ts` — crea el cliente Supabase de servidor con la anon key
  (`createClient` de `@supabase/supabase-js`). Una función `getSupabaseServer()`.
- `lib/cart/reference.ts` — `generateOrderRef()` (ya especificado en el plan de
  pago Nequi; si no existe aún, se crea aquí con su test). Reutilizado por el
  pedido.

### Contacto

- `lib/contact/schema.ts` — `contactoSchema` (zod): `nombre` (min 2), `telefono`
  (min 7), `email` (opcional, email válido si se da), `mensaje` (min 5).
  Exporta `ContactoInput = z.infer<...>`. Con test.
- `lib/contact/actions.ts` — Server Action `enviarMensaje(input)`: valida con
  `contactoSchema`, inserta en `mensajes`, devuelve `{ ok: true }` o
  `{ ok: false, error }`.
- `lib/contact/whatsapp.ts` — `buildContactoMessage(input, whatsappNumber)` puro:
  arma texto + url `wa.me`. Con test.
- `components/contact/ContactForm.tsx` — formulario (rhf + zod) que llama la
  Server Action y, ante éxito, abre WhatsApp y muestra confirmación.
- `app/contacto/page.tsx` — renderiza `ContactForm` (reemplaza el botón actual;
  conserva el texto introductorio).

### Pedido nacional

- `lib/order/schema.ts` — `pedidoSchema` (zod): `nombre` (min 2), `telefono`
  (min 7), `email` (opcional), `departamento` (uno de `DEPARTAMENTOS`), `ciudad`
  (min 2), `direccion` (min 4), `notas` (opcional). Exporta `PedidoInput`. Con
  test (acepta válido, rechaza departamento inválido).
- `lib/order/actions.ts` — Server Action `crearPedido(input, items, referencia)`:
  valida `pedidoSchema` + que `items` no esté vacío, calcula `subtotal_cop`,
  inserta en `pedidos` y los `pedido_items`, devuelve `{ ok, referencia }`.
- `components/order/OrderForm.tsx` — toma los ítems del carrito (Zustand) y los
  datos de envío. Al enviar: genera referencia, llama `crearPedido`, y ante
  éxito abre WhatsApp (reusa `buildWhatsAppMessage(items, customer, num, ref)`),
  limpia el carrito y muestra confirmación. Si el carrito está vacío, muestra un
  aviso con enlace a `/tienda`.
- `app/pedido/page.tsx` — renderiza el resumen del carrito + `OrderForm`.
- `components/cart/CartDrawer.tsx` — el CTA principal pasa a ser un enlace
  **"Continuar al pedido"** hacia `/pedido` (consolida el checkout). El
  `CheckoutForm` inline actual se retira del drawer (su lógica de WhatsApp queda
  cubierta por `/pedido`).

### WhatsApp

- `lib/cart/whatsapp.ts` — Fase A es **autocontenida**: el plan de pago Nequi aún
  no se implementó, así que aquí se extiende `buildWhatsAppMessage` a la firma
  `(items, customer, whatsappNumber, reference)` (añadiendo `reference` y una
  línea de referencia al texto) y se actualizan sus tests. Este cambio es
  idéntico/compatible con el plan de Nequi, de modo que no entran en conflicto.
- El tipo `Customer` se amplía con `departamento?: string` y `ciudad` para el
  pedido nacional; el texto del mensaje incluye departamento y ciudad. Se
  actualizan los tests de `whatsapp.ts` para cubrir el nuevo campo.

## Flujo de datos

```
Contacto:
  ContactForm → enviarMensaje (Server Action) → insert mensajes
            → ok → abrir WhatsApp (buildContactoMessage) → confirmación

Pedido nacional:
  carrito (Zustand) + OrderForm
    → generateOrderRef()
    → crearPedido (Server Action) → insert pedidos + pedido_items
    → ok → abrir WhatsApp (buildWhatsAppMessage con referencia)
         → limpiar carrito → confirmación
```

## Manejo de errores

- Las Server Actions devuelven un `Result` (`{ ok: false, error }`) ante fallo de
  validación o de inserción; el formulario muestra un mensaje de error y no abre
  WhatsApp.
- Validación doble (cliente con rhf+zod para UX; servidor con zod como fuente de
  verdad).

## Testing

- `content/colombia.ts`: 33 entradas, sin duplicados, incluye `Bogotá D.C.`.
- `lib/contact/schema.ts`: acepta válido; rechaza nombre corto, teléfono corto,
  email inválido.
- `lib/contact/whatsapp.ts`: el texto incluye nombre, teléfono y mensaje; la url
  empieza por `https://wa.me/<num>?text=`.
- `lib/order/schema.ts`: acepta válido; rechaza departamento fuera de la lista.
- `lib/cart/reference.ts`: formato `SAVIA-XXXX`, sin caracteres ambiguos.
- Inserciones en Supabase: verificación manual (integración) revisando el
  dashboard.
- Verificación final: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Dependencias nuevas

- `@supabase/supabase-js`.

## Fuera de alcance (Fase B — spec aparte)

- Supabase Auth y login del administrador.
- Ruta `/admin` protegida; listar y gestionar pedidos/mensajes; cambiar `estado`.
- Notificaciones por correo.
