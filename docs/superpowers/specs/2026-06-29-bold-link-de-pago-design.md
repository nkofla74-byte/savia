# Migración de pasarela de pagos: Wompi → Bold (Link de pago)

Fecha: 2026-06-29
Estado: diseño aprobado, pendiente de plan de implementación

## Objetivo

Reemplazar la pasarela de pagos en línea del storefront (`/pedido`) de **Wompi**
por **Bold** (Bold.co), usando el producto **Link de pago** (API). Bold cobrará
**tarjeta de crédito, PSE y Nequi**. Se elimina el método "Nequi manual" actual
porque Bold ya cubre Nequi con confirmación automática.

Decisión de seguridad: se usa **Link de pago** (no el botón embebido) para que
**ninguna llave ni firma quede expuesta en el navegador**. Toda la creación del
cobro es server-to-server y el monto se fija en el servidor.

## Alcance

- **Reemplaza**: integración Wompi (código, webhook, env, referencias admin).
- **Elimina**: método "Nequi manual" del storefront y su código muerto asociado.
- **No toca**: el módulo POS del admin (sus pagos son manuales vía ledger de
  abonos, no usan pasarela en línea).

## Arquitectura

Mantiene el patrón actual (redirección + webhook), que mapea 1:1:

```
OrderForm → crearPedidoBold() [server action]
   → inserta pedido (estado_pago='pendiente', metodo_pago='bold')
   → POST a Bold API (server-to-server) → devuelve { url, payment_link }
   → window.location.href = url  (redirige al checkout alojado de Bold)
        ↓ (cliente paga en el dominio de Bold)
   → callback_url = /pedido/resultado?pedido=<id>  (solo MUESTRA estado, no confirma)
        ↑
Webhook /api/bold/webhook  ← ÚNICA fuente de verdad
   → verifica firma HMAC → cruza monto → actualiza estado_pago / estado
```

La confirmación del pago **solo** proviene del webhook firmado. El regreso del
cliente a `/pedido/resultado` nunca marca un pedido como pagado (se puede
falsificar); esa página solo lee el `estado_pago` que ya escribió el webhook.

## API de Bold (verificada contra docs vigentes)

Fuentes:
- https://developers.bold.co/pagos-en-linea/api-link-de-pagos
- https://developers.bold.co/webhook

### Crear link de pago

- **Método/endpoint**: `POST https://integrations.api.bold.co/online/link/v1`
- **Auth**: header `Authorization: x-api-key <llave_de_identidad>`
- **Body**:
  - `amount_type: "CLOSE"`
  - `amount: { currency: "COP", total_amount: <total_cop> }`
  - `reference`: UUID del pedido (≤ 60 chars; UUID = 36, ok)
  - `description`: descripción corta (2–100 chars)
  - `callback_url`: `${SITE_URL}/pedido/resultado?pedido=<id>` (https)
  - `payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"]`
  - `expiration_date`: Unix **nanosegundos**, `now + 1h`
  - `payer_email`: email del cliente si existe
- **Respuesta**: `payload.url` (URL de redirección) y `payload.payment_link`
  (id tipo `LNK_…`). En error, `errors`.

**Importante — montos**: en Bold **COP no tiene decimales**, así que
`total_amount = total_cop` directo. (Wompi usaba centavos = `total_cop * 100`.)

### Webhook

- Bold hace `POST` a nuestro endpoint con header **`x-bold-signature`**.
- **Verificación**: `HMAC-SHA256( base64(rawBody), BOLD_SECRET_KEY )` en hex,
  comparado con el header usando `timingSafeEqual`.
- **Detalle crítico**: la firma es sobre el **body crudo**. En el route handler
  se debe usar `await req.text()` y calcular el HMAC sobre ese texto exacto,
  **no** sobre el JSON reserializado.
- **Modo pruebas**: la firma usa clave vacía (`""`) como secreto.
- **Payload** (campos relevantes):
  - `type`: `SALE_APPROVED` | `SALE_REJECTED` | `VOID_APPROVED` | `VOID_REJECTED`
  - `data.metadata.reference`: nuestra referencia (UUID del pedido)
  - `data.amount.total`: monto en COP (entero)
  - `data.payment_id`: id de la transacción de Bold

### Mapeo de estados

- `SALE_APPROVED` → `aprobado`. Cruza `data.amount.total` contra `total_cop`:
  - coincide → además `estado = 'confirmado'`
  - no coincide → `estado_pago = 'error'` (no se despacha)
- `SALE_REJECTED`, `VOID_APPROVED` → `rechazado`
- `VOID_REJECTED` / otros → se ignoran (200 OK)
- **Idempotencia**: si el pedido ya está `aprobado`, no se reprocesa.

## Base de datos (nueva migración)

Archivo nuevo: `supabase/migrations/20260629_savia_bold_pago.sql` (idempotente).

- Extender el CHECK de `pedidos.metodo_pago` (hoy `in ('manual','wompi')`) para
  incluir `'bold'`, manteniendo `'wompi'` permitido para no romper filas
  históricas: `check (metodo_pago in ('manual','wompi','bold'))`.
  (Nota: el `'efectivo'` de la migración POS pertenece a otra tabla de pagos, no
  a `pedidos`.)
- Actualizar la policy RLS de `20260627_savia_wompi_pago.sql` que enumera
  `metodo_pago in ('manual','wompi')` para incluir `'bold'`.
- Agregar columna `bold_payment_id text` (no se renombra `wompi_transaction_id`,
  queda para historial).

## Archivos

### Nuevos
- `lib/bold/checkout.ts` — `crearLinkPago(params, fetch?)`: construye el body,
  llama a la API de Bold, devuelve `{ ok: true, url, paymentLink } | { ok: false, error }`.
- `lib/bold/webhook.ts` — `verificarFirmaBold(rawBody, signature, secret)`,
  `mapEstadoPagoBold(type)`, y tipos del evento.
- `app/api/bold/webhook/route.ts` — `runtime = "nodejs"`; lee `req.text()`,
  verifica firma, busca pedido por `data.metadata.reference`, aplica idempotencia,
  cruza monto y actualiza vía service-role.
- Tests: `lib/bold/checkout.test.ts`, `lib/bold/webhook.test.ts`.

### Modificados
- `lib/order/actions.ts` — reemplazar `crearPedidoWompi` por `crearPedidoBold`;
  eliminar `crearPedido` (flujo manual del storefront) si queda sin uso.
- `components/order/OrderForm.tsx` — quitar el método/tab "Nequi" y el componente
  `NequiPayment`; dejar un solo flujo "Pagar con Bold (Tarjeta, PSE o Nequi)".
- `lib/admin/estados.ts` — `METODO_LABEL`: añadir `bold: "Bold"` (mantener wompi
  para históricos).
- `lib/admin/queries.ts` — tipo `metodo_pago` incluye `'bold'`; añadir
  `bold_payment_id: string | null`.
- `app/admin/(panel)/pedidos/[id]/page.tsx` — mostrar `bold_payment_id`.
- `app/pedido/resultado/page.tsx` — ajustar copy del estado rechazado (ya no hay
  "pagar por Nequi"; queda "volver a intentar").
- `.env.example` — quitar las 4 vars de Wompi; añadir las de Bold.

### Eliminados
- `lib/wompi/checkout.ts`, `lib/wompi/signature.ts`, `lib/wompi/webhook.ts` y sus tests.
- `app/api/wompi/webhook/route.ts`.
- `components/cart/NequiPayment.tsx` (si queda sin uso tras quitar el método manual).
- Verificar `lib/cart/whatsapp.ts` y su test: si `buildWhatsAppMessage` solo lo
  usaba el flujo Nequi del checkout, queda sin uso — confirmar antes de eliminar.

## Variables de entorno

Quitar (Wompi):
`NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`,
`WOMPI_EVENTS_SECRET`.

Añadir (Bold) — **ninguna `NEXT_PUBLIC`**:
- `BOLD_API_KEY` — llave de identidad (header `x-api-key` para crear links).
- `BOLD_SECRET_KEY` — llave secreta (HMAC del webhook).

`NEXT_PUBLIC_SITE_URL` se sigue usando para el `callback_url`.
La service-role de Supabase se sigue usando en el webhook (igual que hoy).

## Testing (TDD)

- `verificarFirmaBold`: firma válida, firma inválida, secreto vacío (modo prueba),
  header ausente.
- `mapEstadoPagoBold`: cada `type` → estado esperado.
- `crearLinkPago` (con `fetch` mockeado): éxito (devuelve url), error de API
  (devuelve error legible), falta de `BOLD_API_KEY` (mensaje "no disponible").
- Webhook route (si se testea a nivel de integración): cruce de monto que no
  coincide → `error`; idempotencia con pedido ya aprobado.

## Pasos manuales (fuera del código)

1. En el panel de Bold, seleccionar **Link de pago** y obtener la **llave de
   identidad** y la **llave secreta**; ponerlas en `.env` (`BOLD_API_KEY`,
   `BOLD_SECRET_KEY`).
2. Registrar la URL del webhook `https://<dominio>/api/bold/webhook` en la
   sección *Integraciones* del panel de Bold (hasta 5 endpoints permitidos).
3. Probar primero en ambiente de pruebas de Bold (firma con secreto vacío).

## Fuera de alcance

- Notificaciones por WhatsApp Business API (automatizadas).
- Cambios al módulo POS del admin.
- Otros productos de Bold (Datáfono, QR Bre-B, SonoQR, Botón embebido).
