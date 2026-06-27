# Savia — Pago online con Wompi (diseño)

**Fecha:** 2026-06-27
**Estado:** Aprobado — listo para plan de implementación

## Objetivo

Añadir Wompi (Web Checkout) como método de pago **online** al checkout, **junto**
al pago manual por Nequi que ya existe. El pago se verifica de forma automática
mediante un webhook firmado; la dueña ve el pedido marcado como "Pagado · Wompi"
en el panel admin y puede despachar sin verificar nada a mano. El cobro incluye
los productos más una **tarifa fija nacional de envío de $12.000**.

Es la **Fase 2 de pagos** (automática, con pasarela), complementaria a la Fase 1
(Nequi manual, spec `2026-06-22-savia-nequi-pago-manual-design.md`).

## Decisiones (del brainstorming)

- **Coexisten** Wompi y Nequi manual. El cliente elige el método en el checkout.
- **Web Checkout (redirección)**: el cliente paga en la página segura de Wompi y
  vuelve al sitio. Savia nunca toca datos de tarjeta → carga PCI mínima.
- **Cobro = subtotal de productos + $12.000 de envío fijo nacional** (un solo pago).
- **Confirmación por webhook** como única fuente de verdad (no se confía en la
  redirección del navegador).
- **Notificación**: panel admin + el correo que Wompi ya envía al comercio. No se
  construye notificación propia (sin Resend ni WhatsApp Business).

## Principio de seguridad

**Nunca se confía en datos del navegador del cliente. La verdad del pago es el
evento firmado que Wompi envía al webhook y el saldo real en la cuenta Wompi.**

- El monto y la referencia que viajan al checkout van protegidos por una **firma
  de integridad** generada en el servidor con un secreto que nunca llega al
  cliente. Si el cliente altera el monto en la URL, Wompi rechaza la firma.
- El estado "pagado" **solo** lo puede establecer el webhook (con service-role),
  tras validar la firma del evento de Wompi y cruzar el monto contra el pedido.
- La política RLS de INSERT se endurece para que el rol anónimo (cuya key es
  pública) **no pueda** insertar un pedido ya marcado como aprobado.

## Arquitectura

Se añade una mínima superficie de servidor: una **server action** para crear el
pedido y armar la firma, y un **route handler** para el webhook. El resto del
sitio sigue igual.

### Configuración (env vars)

Públicas (cliente):
- `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` — llave pública (`pub_test_…` / `pub_prod_…`).

Privadas (solo servidor, nunca `NEXT_PUBLIC_`):
- `WOMPI_PRIVATE_KEY` — llave privada (para consultar transacciones si hace falta).
- `WOMPI_INTEGRITY_SECRET` — secreto de integridad para firmar el checkout.
- `WOMPI_EVENTS_SECRET` — secreto para validar la firma de los eventos (webhook).
- `SUPABASE_SERVICE_ROLE_KEY` — para que el webhook actualice el pedido saltando RLS.

Ya existentes que se reutilizan: `NEXT_PUBLIC_SITE_URL` (para la URL de retorno).

Se arranca con claves **sandbox** y luego se cambian por las de producción. Se
documenta todo en `.env.example`.

### Modelo de datos (migración nueva)

Se añaden columnas a `public.pedidos`:

- `metodo_pago text not null default 'manual'` con `check (metodo_pago in ('manual','wompi'))`
- `estado_pago text not null default 'pendiente'` con `check (estado_pago in ('pendiente','aprobado','rechazado','error'))`
- `wompi_transaction_id text`
- `envio_cop integer not null default 0` con `check (envio_cop >= 0)`
- `total_cop integer` con `check (total_cop is null or total_cop > 0)`

El flujo Nequi manual sigue funcionando: `metodo_pago='manual'`,
`estado_pago='pendiente'` (la dueña lo gestiona a mano).

### RLS (endurecimiento)

Se reemplaza la política de INSERT de `pedidos` para el rol anónimo por una con
`with check` que impide insertar un pedido pre-aprobado:

```sql
with check (
  estado = 'nuevo'
  and estado_pago = 'pendiente'
  and metodo_pago in ('manual','wompi')
)
```

- El webhook usa la **service-role key**, que ignora RLS → es el único camino que
  puede poner `estado_pago='aprobado'`.
- El admin autenticado (Fase B) ya puede leer y actualizar; sin cambios.

### Flujo del cliente — Wompi

1. Llena los datos de envío (paso 1 del `OrderForm`, sin cambios de campos).
2. En el paso 2 elige **"Tarjeta / PSE (Wompi)"**.
3. Una server action `crearPedidoWompi(input, items)`:
   - Calcula `subtotal`, `envio = 12000`, `total = subtotal + envio`.
   - Inserta el pedido con `metodo_pago='wompi'`, `estado_pago='pendiente'`,
     `envio_cop`, `total_cop`, y genera un `id` (uuid) en el servidor.
   - Calcula la **firma de integridad**.
   - Devuelve los parámetros del checkout (public key, referencia, monto, moneda,
     firma, redirect-url).
4. El cliente es redirigido al Web Checkout de Wompi
   (`https://checkout.wompi.co/p/?…`) con esos parámetros.
5. Paga en Wompi y es redirigido a `NEXT_PUBLIC_SITE_URL/pedido/resultado`.

**Referencia de Wompi = el `id` (uuid) del pedido** → única, sin colisiones. La
referencia humana `SAVIA-XXXX` se conserva para mostrar y para el mensaje de
WhatsApp del flujo manual.

### Firma de integridad (server-side, función pura testeable)

Según la documentación de Wompi, la firma es el SHA-256 (hex) de la concatenación:

```
SHA256( referencia + amountInCents + moneda + WOMPI_INTEGRITY_SECRET )
```

donde `amountInCents = total_cop * 100` y `moneda = "COP"`. Se implementa como
función pura `firmaIntegridad(referencia, amountInCents, moneda, secreto)` con
test determinista (vector de entrada conocido → hash conocido).

> El implementador confirma el formato exacto contra la documentación vigente de
> Wompi al momento de construir (las pasarelas evolucionan).

### Webhook — `app/api/wompi/webhook/route.ts`

Route handler `POST` que:

1. Lee el cuerpo del evento de Wompi.
2. **Valida la firma del evento** (`signature.checksum`): recomputa el SHA-256 de
   la concatenación de los valores indicados en `signature.properties` + el
   `timestamp` + `WOMPI_EVENTS_SECRET`, y compara. Si no coincide → `401`.
3. Para eventos `transaction.updated` con `status = APPROVED`:
   - Busca el pedido por `id = reference`.
   - **Valida el monto** del evento contra `total_cop * 100`. Si no coincide →
     `estado_pago='error'` y no se confirma.
   - Marca `estado_pago='aprobado'`, `estado='confirmado'`, guarda
     `wompi_transaction_id`.
   - **Idempotente**: si ya está aprobado, responde `200` sin reprocesar.
4. Para `DECLINED`/`VOIDED`/`ERROR` → `estado_pago='rechazado'`.
5. Usa el cliente Supabase con **service-role** (nuevo
   `lib/supabase/service.ts`, solo importable en server).
6. Responde `200` rápido (Wompi reintenta si no recibe 200).

### Página de resultado — `app/pedido/resultado/page.tsx`

Tras volver de Wompi, muestra el estado del pago. Como RLS no permite `SELECT` al
rol anónimo en `pedidos`, esta lectura se hace **en el servidor** (Server
Component) leyendo solo los campos de estado del pedido por su `id` mediante el
cliente service-role, o consultando la transacción en la API de Wompi con la
`WOMPI_PRIVATE_KEY`. El `id` es un uuid no adivinable; solo se exponen los campos
de estado, no datos sensibles del cliente. Estados:

- **Aprobado**: confirmación con la referencia `SAVIA-XXXX` y mensaje de despacho.
- **Pendiente**: "Estamos confirmando tu pago" (el webhook puede tardar segundos).
- **Rechazado**: opción de reintentar o usar Nequi manual.

La verdad es el webhook; esta página solo refleja el estado ya persistido.

### Coexistencia y envío

- El **resumen del pedido** muestra en ambos flujos: `Subtotal`, `Envío $12.000`,
  `Total`. La tarifa vive en un solo lugar (`lib/order/envio.ts` → `ENVIO_COP`).
- El **flujo Nequi manual** también cobra el total con envío incluido (el mensaje
  de WhatsApp y el QR reflejan el total con envío), para que ambos métodos sean
  consistentes.

## UI

- `OrderForm` paso 2: selector de método de pago (Nequi manual | Tarjeta/PSE Wompi).
- Resumen con línea de envío y total en los dos métodos.
- Nueva página `/pedido/resultado`.
- Botón Wompi: "Pagar con tarjeta o PSE".

## Admin

- `/admin/pedidos` muestra, por pedido: **método** (`Wompi`/`Nequi`) y **estado de
  pago** con sello (`Pagado` verde para Wompi aprobado; `Por verificar` para Nequi
  manual). Esto le dice a la dueña qué puede despachar.

## Pruebas

- **Unitaria (TDD)**: `firmaIntegridad` — vector conocido → hash conocido.
- **Unitaria (TDD)**: cálculo de envío/total (`ENVIO_COP`, `subtotal+envio`).
- **Unitaria**: validación de firma del webhook + cruce de monto + idempotencia,
  con Supabase mockeado.
- Los 29 tests actuales siguen verdes.
- Verificación manual en **sandbox** con tarjetas de prueba de Wompi: aprobado,
  rechazado y reintento.

## Fuera de alcance (YAGNI)

Reembolsos por API, pagos parciales, tarjetas guardadas, suscripciones, múltiples
zonas/tarifas de envío, notificación propia por correo/WhatsApp (se usa el panel +
el correo que Wompi ya envía al comercio).

## Notas operativas y de seguridad

- "Pagado · Wompi" en el panel = el dinero ya entró; se puede despachar.
- Nequi manual sigue verificándose a mano (saldo real), como en la Fase 1.
- Todos los secretos de Wompi y la service-role key son **server-only**. Solo la
  llave pública de Wompi es `NEXT_PUBLIC_`.
- El webhook valida firma **y** monto antes de confirmar; un evento no firmado o
  con monto distinto nunca marca un pedido como pagado.
- 2FA en GitHub y Vercel + branch protection siguen siendo el candado del deploy.
