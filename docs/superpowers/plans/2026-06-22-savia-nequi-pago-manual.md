# Pago manual por Nequi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un paso de pago por Nequi al checkout: el cliente ve número Nequi + QR oficial + total + código de referencia, paga en su app y envía el comprobante por WhatsApp.

**Architecture:** Sitio 100% estático, sin backend. Toda la lógica es client-side. El número Nequi es env var y el QR un asset estático en `public/` (config de despliegue, nada alterable remotamente). La verdad del pago es el saldo Nequi real de la dueña, verificado manualmente antes de despachar.

**Tech Stack:** Next.js 15/16 (App Router), TypeScript strict, Tailwind (tokens de tema), react-hook-form + zod, Zustand, Vitest, next/image.

**Reference spec:** `docs/superpowers/specs/2026-06-22-savia-nequi-pago-manual-design.md`

**Package manager:** `pnpm`. Ejecutar todo desde `/home/jrxdevs/savia`.

---

## File Structure

```
public/nequi-qr.png            # placeholder; la dueña sube su QR oficial real
.env.example                   # + NEXT_PUBLIC_NEQUI_NUMBER
lib/cart/
  reference.ts                 # generateOrderRef() — código SAVIA-XXXX (nuevo)
  reference.test.ts            # tests (nuevo)
  whatsapp.ts                  # buildWhatsAppMessage + referencia (modificar)
  whatsapp.test.ts             # tests actualizados (modificar)
components/cart/
  NequiPayment.tsx             # UI del paso de pago (nuevo)
  CheckoutForm.tsx             # dos pasos: form -> pay (modificar)
```

---

### Task 1: Config — env var Nequi + QR placeholder

**Files:**
- Modify: `.env.example`
- Create: `public/nequi-qr.png`

- [ ] **Step 1: Añadir la env var a `.env.example`**

Reemplazar el contenido de `.env.example` por:
```
NEXT_PUBLIC_WHATSAPP_NUMBER=57XXXXXXXXXX
NEXT_PUBLIC_NEQUI_NUMBER=57XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Crear el QR placeholder**

Crea un PNG placeholder (la dueña lo reemplaza luego con su QR oficial exportado de la app Nequi). Ejecuta desde la raíz del repo:
```bash
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d > public/nequi-qr.png
```
Expected: `public/nequi-qr.png` existe (PNG válido de 1×1; es solo placeholder).

- [ ] **Step 3: Añadir el valor real a `.env.local` (local, no se commitea)**

Si tienes el número Nequi a mano, agrégalo a `.env.local` (este archivo está en `.gitignore`):
```
NEXT_PUBLIC_NEQUI_NUMBER=573001112233
```
Si no lo tienes aún, el sitio funciona con la cadena vacía (el botón copiar copiará vacío hasta que se configure). No bloquea el build.

- [ ] **Step 4: Commit**

```bash
git add .env.example public/nequi-qr.png
git commit -m "chore: env var Nequi + QR placeholder"
```

---

### Task 2: `lib/cart/reference.ts` — generador de referencia (TDD)

**Files:**
- Create: `lib/cart/reference.ts`
- Test: `lib/cart/reference.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/cart/reference.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { generateOrderRef } from "./reference";

describe("generateOrderRef", () => {
  it("matches SAVIA- followed by 4 unambiguous chars", () => {
    expect(generateOrderRef()).toMatch(/^SAVIA-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("never uses ambiguous chars (0 O 1 I) in the suffix", () => {
    for (let i = 0; i < 1000; i++) {
      const suffix = generateOrderRef().split("-")[1]!;
      expect(suffix).not.toMatch(/[01OI]/);
    }
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test lib/cart/reference.test.ts`
Expected: FAIL — módulo `./reference` no existe.

- [ ] **Step 3: Implementar lo mínimo**

`lib/cart/reference.ts`:
```ts
// Alfabeto sin caracteres ambiguos (excluye 0, O, 1, I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderRef(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `SAVIA-${code}`;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test lib/cart/reference.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cart/reference.ts lib/cart/reference.test.ts
git commit -m "feat: generador de referencia de pedido (SAVIA-XXXX) + tests"
```

---

### Task 3: `buildWhatsAppMessage` con referencia + pago Nequi (TDD)

**Files:**
- Modify: `lib/cart/whatsapp.ts`
- Modify: `lib/cart/whatsapp.test.ts`

- [ ] **Step 1: Actualizar los tests (que ahora fallan por la nueva firma)**

Reemplaza el contenido de `lib/cart/whatsapp.test.ts` por:
```ts
import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage } from "./whatsapp";
import type { CartItem } from "./store";

const items: CartItem[] = [
  { slug: "calma", nombre: "Calma", precioCOP: 13900, qty: 2 },
  { slug: "luz", nombre: "Luz", precioCOP: 21900, qty: 1 },
];
const customer = { nombre: "Ana", telefono: "3001112233", ciudad: "Bogotá", direccion: "Calle 1 #2-3" };

describe("buildWhatsAppMessage", () => {
  it("includes items, customer, subtotal, reference and Nequi payment line", () => {
    const { text } = buildWhatsAppMessage(items, customer, "573001112233", "SAVIA-7X2K");
    expect(text).toContain("Calma x2");
    expect(text).toContain("Luz x1");
    expect(text).toContain("Ana");
    expect(text).toContain("Bogotá");
    expect(text).toContain("$49.700"); // 2*13900 + 21900
    expect(text).toContain("SAVIA-7X2K");
    expect(text).toContain("Nequi");
  });

  it("builds a wa.me url with encoded text and the given number", () => {
    const { url } = buildWhatsAppMessage(items, customer, "573001112233", "SAVIA-7X2K");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Calma x2"));
    expect(url).toContain(encodeURIComponent("SAVIA-7X2K"));
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `pnpm test lib/cart/whatsapp.test.ts`
Expected: FAIL — la firma actual tiene 3 parámetros; el texto no contiene la referencia ni "Nequi".

- [ ] **Step 3: Implementar el cambio**

Reemplaza el contenido de `lib/cart/whatsapp.ts` por:
```ts
import type { CartItem } from "./store";
import { formatCOP } from "@/lib/utils";

export type Customer = { nombre: string; telefono: string; ciudad: string; direccion: string };

export function buildWhatsAppMessage(
  items: CartItem[],
  customer: Customer,
  whatsappNumber: string,
  reference: string,
) {
  const subtotal = items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
  const lines = [
    "Hola Savia 🌿, quiero hacer un pedido:",
    "",
    `Referencia: ${reference}`,
    "",
    ...items.map((i) => `• ${i.nombre} x${i.qty} — ${formatCOP(i.precioCOP * i.qty)}`),
    "",
    `Subtotal: ${formatCOP(subtotal)}`,
    "",
    "Pago: Nequi (ya realizado, adjunto comprobante)",
    "",
    "Mis datos:",
    `Nombre: ${customer.nombre}`,
    `Teléfono: ${customer.telefono}`,
    `Ciudad: ${customer.ciudad}`,
    `Dirección: ${customer.direccion}`,
  ];
  const text = lines.join("\n");
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  return { text, url, subtotal };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `pnpm test lib/cart/whatsapp.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cart/whatsapp.ts lib/cart/whatsapp.test.ts
git commit -m "feat: incluir referencia y pago Nequi en mensaje de WhatsApp"
```

---

### Task 4: `components/cart/NequiPayment.tsx` — UI del paso de pago

**Files:**
- Create: `components/cart/NequiPayment.tsx`

- [ ] **Step 1: Crear el componente**

`components/cart/NequiPayment.tsx`:
```tsx
"use client";
import Image from "next/image";
import { useState } from "react";
import type { CartItem } from "@/lib/cart/store";
import type { Customer } from "@/lib/cart/whatsapp";
import { buildWhatsAppMessage } from "@/lib/cart/whatsapp";
import { formatCOP } from "@/lib/utils";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const NEQUI = process.env.NEXT_PUBLIC_NEQUI_NUMBER ?? "";

export function NequiPayment({
  items,
  customer,
  reference,
  total,
}: {
  items: CartItem[];
  customer: Customer;
  reference: string;
  total: number;
}) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(NEQUI);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendProof = () => {
    const { url } = buildWhatsAppMessage(items, customer, WHATSAPP, reference);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4 text-ink">
      <div className="flex items-baseline justify-between">
        <span className="text-muted">Total a pagar</span>
        <span className="font-display text-xl font-bold text-primary">{formatCOP(total)}</span>
      </div>

      <div className="grid place-items-center rounded-2xl border border-primary/10 bg-surface/40 p-4">
        <Image src="/nequi-qr.png" alt="QR de pago Nequi de Savia" width={180} height={180} className="h-44 w-44 object-contain" />
        <p className="mt-2 text-xs text-muted">Escanea con tu app Nequi</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-surface/50 px-3 py-2">
        <div>
          <p className="text-xs text-muted">Número Nequi</p>
          <p className="font-medium">{NEQUI || "Configura NEXT_PUBLIC_NEQUI_NUMBER"}</p>
        </div>
        <button type="button" onClick={() => void copyNumber()} className="rounded-full border border-primary/30 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
        <p className="text-muted">Referencia del pedido</p>
        <p className="font-mono font-bold text-primary">{reference}</p>
      </div>

      <ol className="list-inside list-decimal space-y-1 text-sm text-ink/80">
        <li>Abre Nequi → <strong>Enviar</strong> o <strong>Pagar con QR</strong>.</li>
        <li>Escanea el QR o escribe el número.</li>
        <li>Paga exactamente <strong>{formatCOP(total)}</strong>.</li>
        <li>En la descripción de la transferencia escribe: <strong>{reference}</strong>.</li>
        <li>Pulsa el botón de abajo y envíanos el comprobante por WhatsApp.</li>
      </ol>

      <p className="text-xs text-muted">Tu pedido se despacha una vez confirmemos el pago.</p>

      <button type="button" onClick={sendProof} className="w-full rounded-full bg-primary py-3 font-medium text-bg transition-opacity hover:opacity-90">
        Ya pagué — enviar comprobante por WhatsApp
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: ambos limpios (sin errores ni warnings).

- [ ] **Step 3: Commit**

```bash
git add components/cart/NequiPayment.tsx
git commit -m "feat: UI de pago Nequi (QR, número, referencia, instrucciones)"
```

---

### Task 5: `CheckoutForm` en dos pasos (form → pago)

**Files:**
- Modify: `components/cart/CheckoutForm.tsx`

- [ ] **Step 1: Reemplazar el componente**

Reemplaza el contenido de `components/cart/CheckoutForm.tsx` por:
```tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart/store";
import { generateOrderRef } from "@/lib/cart/reference";
import { NequiPayment } from "./NequiPayment";

const schema = z.object({
  nombre: z.string().min(2, "Tu nombre"),
  telefono: z.string().min(7, "Teléfono válido"),
  ciudad: z.string().min(2, "Ciudad"),
  direccion: z.string().min(4, "Dirección"),
});
type FormValues = z.infer<typeof schema>;

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const [order, setOrder] = useState<{ customer: FormValues; reference: string } | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    setOrder({ customer: data, reference: generateOrderRef() });
  };

  if (order) {
    return (
      <div className="space-y-3">
        <NequiPayment items={items} customer={order.customer} reference={order.reference} total={subtotal} />
        <button type="button" onClick={() => setOrder(null)} className="w-full text-sm text-muted hover:text-primary">
          ← Volver a mis datos
        </button>
      </div>
    );
  }

  const field = (name: keyof FormValues, label: string) => (
    <div>
      <input {...register(name)} placeholder={label} className="w-full rounded-lg border border-primary/20 bg-surface/50 px-3 py-2 text-sm" />
      {errors[name] && <p className="mt-1 text-xs text-accent">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {field("nombre", "Nombre")}
      {field("telefono", "Teléfono")}
      {field("ciudad", "Ciudad")}
      {field("direccion", "Dirección")}
      <button type="submit" className="mt-2 w-full rounded-full bg-primary py-3 font-medium text-bg hover:opacity-90">
        Continuar al pago
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: ambos limpios.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CheckoutForm.tsx
git commit -m "feat: checkout en dos pasos (datos -> pago Nequi)"
```

---

### Task 6: Verificación final end-to-end

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Suite completa**

Run: `pnpm test`
Expected: PASS — todos los archivos (utils, products, cart store, whatsapp, reference) en verde.

- [ ] **Step 2: Typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: los tres en verde; `/`, `/tienda`, 7 páginas de producto, `/sobre`, `/contacto`, `/legales` se generan.

- [ ] **Step 3: Verificación manual**

Run: `pnpm dev` → abre `http://localhost:3000/tienda`.
- Agrega un producto, abre el carrito, llena el formulario, pulsa "Continuar al pago".
- Verifica que aparece el paso Nequi con total, QR (placeholder), número con botón copiar, y la referencia `SAVIA-XXXX`.
- Pulsa "Ya pagué — enviar comprobante por WhatsApp": se abre una pestaña a `wa.me/<número>` con el pedido + referencia + línea de Nequi.
- Pulsa "← Volver a mis datos": regresa al formulario.
- Verifica que el toggle de tema (crema ⇄ botica) cambia paletas en el paso de pago, y que con `prefers-reduced-motion` activado no hay animación.

- [ ] **Step 4: Commit (si quedó algún ajuste)**

```bash
git add -A
git commit -m "chore: verificación final pago Nequi"
```

---

## Notas de seguridad (recordatorio para quien implementa)

- El número/QR son config de despliegue; no hay backend ni DB editable.
- El monto en pantalla es informativo. La verdad es el saldo Nequi real: la
  dueña confirma el ingreso antes de despachar. El comprobante del cliente no es
  prueba suficiente por sí solo.
