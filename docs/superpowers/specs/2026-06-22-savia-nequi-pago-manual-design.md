# Savia — Pago manual por Nequi (diseño)

**Fecha:** 2026-06-22
**Estado:** Aprobado — listo para plan de implementación

## Objetivo

Añadir un paso de pago por Nequi al checkout existente. El cliente, tras llenar
sus datos, ve el número Nequi + QR oficial + total + un código de referencia
único del pedido, paga desde su app Nequi y envía el comprobante por WhatsApp.
La dueña verifica el pago contra su saldo Nequi real antes de despachar.

Es la **Fase 1 de pagos** (manual, sin comisiones, sin backend). La integración
automática con pasarela (Wompi) queda como fase 2 en un spec aparte.

## Principio de seguridad

**Nunca se confía en datos del navegador del cliente. La única fuente de verdad
es lo que realmente llega a la cuenta Nequi.**

- El número Nequi y el QR son configuración de despliegue (env var + asset
  estático), no hay base de datos ni panel editable → nada alterable remotamente.
- El monto mostrado en la web es solo informativo; la verdad es el saldo Nequi.
- El comprobante que envía el cliente es cortesía, no prueba: la dueña confirma
  en su propia app Nequi que el dinero entró.
- Sitio 100% estático + HTTPS → superficie de ataque mínima.

## Arquitectura

Se mantiene el sitio **100% estático, sin backend**. Toda la lógica es
client-side. No se añaden API routes, ni base de datos, ni webhooks.

### Configuración (deploy-time)

- `NEXT_PUBLIC_NEQUI_NUMBER` — número Nequi de Savia (nueva env var, junto a
  `NEXT_PUBLIC_WHATSAPP_NUMBER` que ya existe).
- `public/nequi-qr.png` — QR oficial exportado desde la app Nequi por la dueña.
  Mientras no exista el real, se usa un placeholder. Se muestra con `next/image`.
- `.env.example` — documenta `NEXT_PUBLIC_NEQUI_NUMBER`.

## Flujo del cliente

1. Agrega productos → abre el carrito → llena el formulario (nombre, teléfono,
   ciudad, dirección). **Sin cambios respecto a hoy.**
2. Al enviar el formulario válido, el drawer transiciona de un paso `form` a un
   paso `pay` (estado local, sin recarga). Se genera la referencia del pedido.
3. El paso de pago muestra:
   - **Total a pagar** (`formatCOP` del subtotal).
   - **Número Nequi** con botón *copiar*.
   - **QR oficial** (imagen).
   - **Código de referencia** del pedido (ej. `SAVIA-7X2K`).
   - **Instrucciones paso a paso**, incluyendo poner la referencia en la
     descripción de la transferencia Nequi.
   - Nota de que el pedido se despacha al **confirmar el pago**.
4. El cliente paga desde su app Nequi (con la referencia en la descripción).
5. Pulsa **"Ya pagué — enviar comprobante por WhatsApp"** → se abre `wa.me` con
   el pedido completo + referencia + línea "Ya pagué por Nequi, adjunto
   comprobante". El cliente adjunta el screenshot en el chat.
6. La dueña verifica en su app Nequi que el monto llegó (cruzando por
   referencia/nombre/monto) y despacha.

## Componentes

### `lib/cart/reference.ts` (nuevo, con tests — TDD)

Generador del código de referencia del pedido.

- `generateOrderRef(): string` → formato `SAVIA-XXXX`, con `XXXX` de 4
  caracteres de un alfabeto sin caracteres ambiguos (excluye `0`, `O`, `1`, `I`).
  Alfabeto: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Pruebas: formato (`/^SAVIA-[A-HJ-NP-Z2-9]{4}$/`), longitud, y que en una
  muestra grande ningún código contiene caracteres prohibidos (`0`, `O`, `1`,
  `I`).

### `lib/cart/whatsapp.ts` (modificar — actualizar tests)

Extender `buildWhatsAppMessage` para incluir el pago Nequi.

- Nueva firma: `buildWhatsAppMessage(items, customer, whatsappNumber, reference)`.
- El texto añade una línea de referencia (ej. `Referencia: SAVIA-7X2K`) y una
  línea de método de pago (ej. `Pago: Nequi (ya realizado, adjunto comprobante)`).
- Se actualizan los tests existentes para pasar la referencia y verificar que el
  mensaje la incluye junto con la línea de Nequi. Se conserva la verificación de
  ítems, datos del cliente, subtotal y URL `wa.me`.

### `components/cart/NequiPayment.tsx` (nuevo)

UI del paso de pago. Props: `items`, `customer`, `reference`, `total`.

- Total a pagar, número Nequi (`NEXT_PUBLIC_NEQUI_NUMBER`) con botón copiar
  (usa `navigator.clipboard`), QR (`/nequi-qr.png`), código de referencia,
  instrucciones, y botón "Ya pagué — enviar comprobante por WhatsApp" que llama
  a `buildWhatsAppMessage(..., reference)` y abre la URL en pestaña nueva.
- Estilo por tokens de tema (`bg`, `surface`, `primary`, `ink`, `accent`,
  `muted`); accesible AA; respeta `prefers-reduced-motion` si hay animación.

### `components/cart/CheckoutForm.tsx` (modificar)

Maneja dos pasos con estado local: `step: "form" | "pay"`.

- `form`: el formulario actual (rhf + zod). Al hacer submit válido, genera la
  referencia con `generateOrderRef()`, guarda los datos del cliente y pasa a
  `pay`.
- `pay`: renderiza `<NequiPayment items customer reference total />`.
- Opción de "volver" del paso de pago al formulario.

## Datos / flujo

```
cart items + datos del formulario
  → generateOrderRef()
  → NequiPayment muestra número/QR/referencia/total
  → cliente paga en Nequi (referencia en la descripción)
  → "enviar comprobante" → buildWhatsAppMessage(..., referencia) → wa.me
  → cliente adjunta screenshot
  → dueña verifica en Nequi → despacha
```

## Copy / legales

- En el paso de pago, nota breve: "Tu pedido se despacha una vez confirmemos el
  pago." No se tocan los avisos INVIMA existentes.

## Testing

- `reference.ts`: formato, charset (sin ambiguos), longitud.
- `whatsapp.ts`: el mensaje incluye la referencia y la línea de pago Nequi,
  además de las verificaciones existentes.
- Verificación final: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`
  en verde.

## Fuera de alcance (fase 2, spec aparte)

- Confirmación automática del pago, webhooks, firma de integridad.
- Integración con pasarela (Wompi u otra) y cuenta de comercio.
- Verificación de pago en tiempo real.
