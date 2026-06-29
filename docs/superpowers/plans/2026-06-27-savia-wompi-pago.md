# Pago online con Wompi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir Wompi (Web Checkout, redirección) como método de pago online junto al Nequi manual, con confirmación automática por webhook firmado y envío fijo nacional de $12.000.

**Architecture:** El cliente elige método en el checkout. Para Wompi, una server action crea el pedido (`estado_pago='pendiente'`), firma el monto y redirige al Web Checkout de Wompi. Wompi notifica un webhook firmado (`/api/wompi/webhook`) que, con la service-role key, marca el pedido como pagado. El estado se ve en `/admin/pedidos`. Nequi manual sigue funcionando.

**Tech Stack:** Next.js 15 (App Router, route handlers, Server Actions), TypeScript strict, Supabase (RLS + service-role), Tailwind (tokens), react-hook-form + zod, Zustand, Vitest, `node:crypto`.

**Reference spec:** `docs/superpowers/specs/2026-06-27-savia-wompi-pago-design.md`

**Package manager:** `pnpm`. Ejecutar todo desde `/home/jrxdevs/savia`.

---

## File Structure

```
supabase/migrations/
  20260627_savia_wompi_pago.sql      # columnas de pago + RLS endurecida (nuevo)
.env.example                         # + vars Wompi + service-role (modificar)
lib/order/
  envio.ts                           # ENVIO_COP + calcularTotal (nuevo)
  envio.test.ts                      # tests (nuevo)
  actions.ts                         # crearPedidoWompi + envío en manual (modificar)
lib/wompi/
  signature.ts                       # firmaIntegridad (nuevo)
  signature.test.ts                  # tests (nuevo)
  checkout.ts                        # buildWompiCheckoutUrl (nuevo)
  checkout.test.ts                   # tests (nuevo)
  webhook.ts                         # verificarFirmaEvento + mapEstadoPago (nuevo)
  webhook.test.ts                    # tests (nuevo)
lib/supabase/
  service.ts                         # cliente service-role (nuevo)
lib/admin/
  estados.ts                         # ESTADO_PAGO_LABEL + METODO_LABEL (modificar)
  queries.ts                         # campos de pago en PedidoRow (modificar)
app/api/wompi/webhook/
  route.ts                           # handler POST del webhook (nuevo)
app/pedido/resultado/
  page.tsx                           # página de resultado (nuevo)
components/order/
  OrderForm.tsx                      # selector de método + envío + redirect Wompi (modificar)
  ClearCartOnSuccess.tsx             # limpia carrito si el pago fue aprobado (nuevo)
components/admin/
  PedidoCard.tsx                     # sellos de método/estado de pago (modificar)
```

---

### Task 1: Migración — columnas de pago + RLS endurecida

**Files:**
- Create: `supabase/migrations/20260627_savia_wompi_pago.sql`

- [ ] **Step 1: Crear la migración**

`supabase/migrations/20260627_savia_wompi_pago.sql`:
```sql
-- Savia — Pago online con Wompi: columnas de pago en pedidos + RLS endurecida.

alter table public.pedidos
  add column if not exists metodo_pago text not null default 'manual'
    check (metodo_pago in ('manual','wompi')),
  add column if not exists estado_pago text not null default 'pendiente'
    check (estado_pago in ('pendiente','aprobado','rechazado','error')),
  add column if not exists wompi_transaction_id text,
  add column if not exists envio_cop integer not null default 0
    check (envio_cop >= 0),
  add column if not exists total_cop integer
    check (total_cop is null or total_cop > 0);

-- Endurecer el INSERT anónimo: nadie puede insertar un pedido ya "aprobado".
-- Solo el webhook (service-role, salta RLS) puede marcar estado_pago='aprobado'.
drop policy if exists "anon puede insertar pedidos" on public.pedidos;

create policy "anon inserta pedidos pendientes"
  on public.pedidos for insert
  to anon
  with check (
    estado = 'nuevo'
    and estado_pago = 'pendiente'
    and metodo_pago in ('manual','wompi')
  );
```

- [ ] **Step 2: Aplicar la migración**

Aplicar con la herramienta MCP de Supabase (`apply_migration`, nombre `savia_wompi_pago`) o, si se usa CLU local, `supabase db push`. Verificar luego con `list_tables` que `pedidos` tiene las columnas `metodo_pago`, `estado_pago`, `wompi_transaction_id`, `envio_cop`, `total_cop`.

Expected: la tabla `pedidos` tiene las 5 columnas nuevas y la política `anon inserta pedidos pendientes` existe.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260627_savia_wompi_pago.sql
git commit -m "feat(db): columnas de pago Wompi + RLS de INSERT endurecida"
```

---

### Task 2: Env vars + cliente service-role

**Files:**
- Modify: `.env.example`
- Create: `lib/supabase/service.ts`

- [ ] **Step 1: Añadir las env vars a `.env.example`**

Añadir al final de `.env.example` (después de las líneas de Supabase existentes):
```
# Wompi (pasarela de pagos). Empieza con claves sandbox (pub_test_/prv_test_).
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxx
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_INTEGRITY_SECRET=test_integrity_xxx
WOMPI_EVENTS_SECRET=test_events_xxx
# Supabase service-role (SOLO servidor: usada por el webhook de Wompi). Nunca NEXT_PUBLIC.
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

- [ ] **Step 2: Crear el cliente service-role**

`lib/supabase/service.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Cliente con service-role: SALTA RLS. Importar SOLO en código de servidor
// (webhook de Wompi, lecturas de estado en server components). Nunca exponer
// al cliente ni usar la service key en componentes con "use client".
export function getSupabaseService() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add .env.example lib/supabase/service.ts
git commit -m "feat: env vars de Wompi + cliente Supabase service-role"
```

---

### Task 3: `lib/order/envio.ts` — tarifa y total (TDD)

**Files:**
- Create: `lib/order/envio.ts`
- Test: `lib/order/envio.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/order/envio.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ENVIO_COP, calcularTotal } from "./envio";

describe("envío nacional", () => {
  it("la tarifa fija es 12000", () => {
    expect(ENVIO_COP).toBe(12000);
  });

  it("calcularTotal suma el subtotal y el envío", () => {
    expect(calcularTotal(13900)).toBe(13900 + 12000);
    expect(calcularTotal(0)).toBe(12000);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test lib/order/envio.test.ts`
Expected: FAIL — módulo `./envio` no existe.

- [ ] **Step 3: Implementar**

`lib/order/envio.ts`:
```ts
// Tarifa fija de envío nacional (COP enteros). Único lugar de la verdad.
export const ENVIO_COP = 12000;

export function calcularTotal(subtotalCop: number): number {
  return subtotalCop + ENVIO_COP;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test lib/order/envio.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/order/envio.ts lib/order/envio.test.ts
git commit -m "feat: tarifa fija de envío nacional + calcularTotal (TDD)"
```

---

### Task 4: `lib/wompi/signature.ts` — firma de integridad (TDD)

**Files:**
- Create: `lib/wompi/signature.ts`
- Test: `lib/wompi/signature.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/wompi/signature.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { firmaIntegridad } from "./signature";

describe("firmaIntegridad", () => {
  it("es el SHA-256 hex de referencia+monto+moneda+secreto en ese orden", () => {
    const esperado = createHash("sha256")
      .update("SAVIA-7X2K" + 4900000 + "COP" + "secreto")
      .digest("hex");
    expect(firmaIntegridad("SAVIA-7X2K", 4900000, "COP", "secreto")).toBe(esperado);
  });

  it("devuelve 64 caracteres hexadecimales y es determinista", () => {
    const a = firmaIntegridad("ref", 100, "COP", "s");
    const b = firmaIntegridad("ref", 100, "COP", "s");
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test lib/wompi/signature.test.ts`
Expected: FAIL — módulo `./signature` no existe.

- [ ] **Step 3: Implementar**

`lib/wompi/signature.ts`:
```ts
import { createHash } from "node:crypto";

// Firma de integridad del Web Checkout de Wompi:
// SHA-256(hex) de la concatenación referencia + montoEnCentavos + moneda + secreto.
// Confirmar el formato contra la documentación vigente de Wompi al integrar.
export function firmaIntegridad(
  referencia: string,
  montoEnCentavos: number,
  moneda: string,
  secreto: string,
): string {
  return createHash("sha256")
    .update(`${referencia}${montoEnCentavos}${moneda}${secreto}`)
    .digest("hex");
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test lib/wompi/signature.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/wompi/signature.ts lib/wompi/signature.test.ts
git commit -m "feat: firma de integridad de Wompi (TDD)"
```

---

### Task 5: `lib/wompi/checkout.ts` — URL del Web Checkout (TDD)

**Files:**
- Create: `lib/wompi/checkout.ts`
- Test: `lib/wompi/checkout.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/wompi/checkout.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildWompiCheckoutUrl } from "./checkout";

describe("buildWompiCheckoutUrl", () => {
  it("arma la URL del checkout con todos los parámetros obligatorios", () => {
    const url = buildWompiCheckoutUrl({
      publicKey: "pub_test_123",
      amountInCents: 4900000,
      reference: "uuid-1",
      redirectUrl: "https://savia.co/pedido/resultado?pedido=uuid-1",
      signature: "abc123",
    });
    expect(url.startsWith("https://checkout.wompi.co/p/?")).toBe(true);
    expect(url).toContain("public-key=pub_test_123");
    expect(url).toContain("currency=COP");
    expect(url).toContain("amount-in-cents=4900000");
    expect(url).toContain("reference=uuid-1");
    expect(url).toContain(encodeURIComponent("abc123"));
    expect(url).toContain(encodeURIComponent("https://savia.co/pedido/resultado?pedido=uuid-1"));
  });

  it("incluye datos del cliente solo cuando se proporcionan", () => {
    const sin = buildWompiCheckoutUrl({
      publicKey: "k", amountInCents: 100, reference: "r", redirectUrl: "u", signature: "s",
    });
    expect(sin).not.toContain("customer-data");
    const con = buildWompiCheckoutUrl({
      publicKey: "k", amountInCents: 100, reference: "r", redirectUrl: "u", signature: "s",
      customer: { fullName: "Ana", email: "a@b.co", phone: "3001112233" },
    });
    expect(con).toContain(encodeURIComponent("Ana"));
    expect(con).toContain("customer-data%3Aemail=a%40b.co");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test lib/wompi/checkout.test.ts`
Expected: FAIL — módulo `./checkout` no existe.

- [ ] **Step 3: Implementar**

`lib/wompi/checkout.ts`:
```ts
export type WompiCheckoutParams = {
  publicKey: string;
  amountInCents: number;
  reference: string;
  redirectUrl: string;
  signature: string;
  currency?: string;
  customer?: { fullName?: string; email?: string; phone?: string };
};

export function buildWompiCheckoutUrl(p: WompiCheckoutParams): string {
  const params = new URLSearchParams({
    "public-key": p.publicKey,
    currency: p.currency ?? "COP",
    "amount-in-cents": String(p.amountInCents),
    reference: p.reference,
    "signature:integrity": p.signature,
    "redirect-url": p.redirectUrl,
  });
  if (p.customer?.fullName) params.set("customer-data:full-name", p.customer.fullName);
  if (p.customer?.email) params.set("customer-data:email", p.customer.email);
  if (p.customer?.phone) params.set("customer-data:phone-number", p.customer.phone);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test lib/wompi/checkout.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/wompi/checkout.ts lib/wompi/checkout.test.ts
git commit -m "feat: builder de URL del Web Checkout de Wompi (TDD)"
```

---

### Task 6: `lib/wompi/webhook.ts` — validación de evento (TDD)

**Files:**
- Create: `lib/wompi/webhook.ts`
- Test: `lib/wompi/webhook.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/wompi/webhook.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { verificarFirmaEvento, mapEstadoPago, type WompiEvent } from "./webhook";

const SECRET = "events_secret";

function eventoConChecksum(status: string): WompiEvent {
  const base = {
    event: "transaction.updated",
    data: { transaction: { id: "txn_1", status, reference: "uuid-1", amount_in_cents: 4900000 } },
    signature: { properties: ["transaction.id", "transaction.status", "transaction.amount-in-cents"], checksum: "" },
    timestamp: 1700000000,
  } as WompiEvent;
  // checksum = sha256( valores de las properties + timestamp + secreto )
  const concat = "txn_1" + status + 4900000 + base.timestamp + SECRET;
  base.signature.checksum = createHash("sha256").update(concat).digest("hex");
  return base;
}

describe("verificarFirmaEvento", () => {
  it("acepta un evento con checksum válido", () => {
    expect(verificarFirmaEvento(eventoConChecksum("APPROVED"), SECRET)).toBe(true);
  });

  it("rechaza un evento manipulado", () => {
    const ev = eventoConChecksum("APPROVED");
    ev.data.transaction.amount_in_cents = 1; // manipulación
    expect(verificarFirmaEvento(ev, SECRET)).toBe(false);
  });
});

describe("mapEstadoPago", () => {
  it("mapea los estados de Wompi a los nuestros", () => {
    expect(mapEstadoPago("APPROVED")).toBe("aprobado");
    expect(mapEstadoPago("DECLINED")).toBe("rechazado");
    expect(mapEstadoPago("VOIDED")).toBe("rechazado");
    expect(mapEstadoPago("ERROR")).toBe("error");
    expect(mapEstadoPago("PENDING")).toBe("pendiente");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test lib/wompi/webhook.test.ts`
Expected: FAIL — módulo `./webhook` no existe.

- [ ] **Step 3: Implementar**

`lib/wompi/webhook.ts`:
```ts
import { createHash } from "node:crypto";

export type WompiEvent = {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
    };
  };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

export type EstadoPago = "aprobado" | "rechazado" | "pendiente" | "error";

// El checksum de Wompi es el SHA-256 de: los valores de cada property indicada
// (en orden) + el timestamp + el secreto de eventos. Las properties vienen como
// "transaction.id" / "transaction.amount-in-cents"; el guion se normaliza a guion
// bajo para leer del objeto. Confirmar el formato contra la doc vigente de Wompi.
export function verificarFirmaEvento(event: WompiEvent, secret: string): boolean {
  if (!event?.signature?.checksum || !secret) return false;
  const concat = event.signature.properties
    .map((path) => leerRuta(event.data, path))
    .join("");
  const cadena = `${concat}${event.timestamp}${secret}`;
  const calculado = createHash("sha256").update(cadena).digest("hex");
  return calculado.toLowerCase() === event.signature.checksum.toLowerCase();
}

function leerRuta(obj: unknown, path: string): string {
  const value = path
    .split(".")
    .map((k) => k.replace(/-/g, "_"))
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  return String(value ?? "");
}

export function mapEstadoPago(status: string): EstadoPago {
  switch (status) {
    case "APPROVED":
      return "aprobado";
    case "DECLINED":
    case "VOIDED":
      return "rechazado";
    case "ERROR":
      return "error";
    default:
      return "pendiente";
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test lib/wompi/webhook.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/wompi/webhook.ts lib/wompi/webhook.test.ts
git commit -m "feat: validación de firma y mapeo de estado del webhook Wompi (TDD)"
```

---

### Task 7: Server action `crearPedidoWompi` + envío en el flujo manual

**Files:**
- Modify: `lib/order/actions.ts`

- [ ] **Step 1: Reemplazar el contenido de `lib/order/actions.ts`**

```ts
"use server";
import { pedidoSchema, type PedidoInput } from "./schema";
import { ENVIO_COP, calcularTotal } from "./envio";
import type { CartItem } from "@/lib/cart/store";
import { getSupabaseServer } from "@/lib/supabase/server";
import { generateOrderRef } from "@/lib/cart/reference";
import { firmaIntegridad } from "@/lib/wompi/signature";
import { buildWompiCheckoutUrl } from "@/lib/wompi/checkout";

export type CrearPedidoResult =
  | { ok: true; referencia: string }
  | { ok: false; error: string };

export type CrearPedidoWompiResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function subtotalDe(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
}

async function insertarPedido(
  parsed: PedidoInput,
  items: CartItem[],
  opts: { referencia: string; metodoPago: "manual" | "wompi" },
): Promise<{ ok: true; id: string; subtotal: number; total: number } | { ok: false; error: string }> {
  const subtotal = subtotalDe(items);
  const total = calcularTotal(subtotal);
  const supabase = getSupabaseServer();
  const pedidoId = crypto.randomUUID();

  const { error } = await supabase.from("pedidos").insert({
    id: pedidoId,
    referencia: opts.referencia,
    nombre: parsed.nombre,
    telefono: parsed.telefono,
    email: parsed.email || null,
    departamento: parsed.departamento,
    ciudad: parsed.ciudad,
    direccion: parsed.direccion,
    notas: parsed.notas || null,
    subtotal_cop: subtotal,
    envio_cop: ENVIO_COP,
    total_cop: total,
    metodo_pago: opts.metodoPago,
    estado_pago: "pendiente",
  });
  if (error) return { ok: false, error: "No se pudo crear el pedido. Intenta de nuevo." };

  const rows = items.map((i) => ({
    pedido_id: pedidoId,
    slug: i.slug,
    nombre: i.nombre,
    precio_cop: i.precioCOP,
    qty: i.qty,
  }));
  const { error: itemsError } = await supabase.from("pedido_items").insert(rows);
  if (itemsError) return { ok: false, error: "No se pudieron guardar los productos del pedido." };

  return { ok: true, id: pedidoId, subtotal, total };
}

// Flujo Nequi manual: guarda el pedido (incluye envío) y devuelve la referencia.
export async function crearPedido(
  input: PedidoInput,
  items: CartItem[],
  referencia: string,
): Promise<CrearPedidoResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const res = await insertarPedido(parsed.data, items, { referencia, metodoPago: "manual" });
  if (!res.ok) return res;
  return { ok: true, referencia };
}

// Flujo Wompi: guarda el pedido pendiente y devuelve la URL del Web Checkout.
export async function crearPedidoWompi(
  input: PedidoInput,
  items: CartItem[],
): Promise<CrearPedidoWompiResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!publicKey || !integritySecret) {
    return { ok: false, error: "El pago con tarjeta no está disponible por ahora." };
  }

  const referencia = generateOrderRef();
  const res = await insertarPedido(parsed.data, items, { referencia, metodoPago: "wompi" });
  if (!res.ok) return res;

  // La referencia de Wompi es el uuid del pedido (única, sin colisiones).
  const amountInCents = res.total * 100;
  const signature = firmaIntegridad(res.id, amountInCents, "COP", integritySecret);
  const url = buildWompiCheckoutUrl({
    publicKey,
    amountInCents,
    reference: res.id,
    redirectUrl: `${siteUrl}/pedido/resultado?pedido=${res.id}`,
    signature,
    customer: {
      fullName: parsed.data.nombre,
      email: parsed.data.email || undefined,
      phone: parsed.data.telefono,
    },
  });
  return { ok: true, url };
}
```

- [ ] **Step 2: Verificar typecheck + tests**

Run: `pnpm typecheck && pnpm test`
Expected: typecheck limpio; todos los tests verdes (incluye los nuevos de Tasks 3–6 y los 29 previos).

- [ ] **Step 3: Commit**

```bash
git add lib/order/actions.ts
git commit -m "feat: crearPedidoWompi + envío y total en el pedido"
```

---

### Task 8: Webhook `app/api/wompi/webhook/route.ts`

**Files:**
- Create: `app/api/wompi/webhook/route.ts`

- [ ] **Step 1: Crear el handler**

`app/api/wompi/webhook/route.ts`:
```ts
import { NextResponse } from "next/server";
import { verificarFirmaEvento, mapEstadoPago, type WompiEvent } from "@/lib/wompi/webhook";
import { getSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET ?? "";

export async function POST(req: Request) {
  let event: WompiEvent;
  try {
    event = (await req.json()) as WompiEvent;
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  if (!verificarFirmaEvento(event, EVENTS_SECRET)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  const tx = event.data?.transaction;
  if (!tx?.reference) return NextResponse.json({ ok: true });

  const supabase = getSupabaseService();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, total_cop, estado_pago")
    .eq("id", tx.reference)
    .single();

  if (!pedido) return NextResponse.json({ ok: true });
  // Idempotencia: si ya está aprobado, no reprocesar.
  if (pedido.estado_pago === "aprobado") return NextResponse.json({ ok: true });

  const estadoPago = mapEstadoPago(tx.status);
  const update: Record<string, unknown> = {
    estado_pago: estadoPago,
    wompi_transaction_id: tx.id,
  };

  if (estadoPago === "aprobado") {
    // Cruzar el monto contra el pedido. Si no coincide, marcar error (no despachar).
    if (pedido.total_cop != null && tx.amount_in_cents !== pedido.total_cop * 100) {
      update.estado_pago = "error";
    } else {
      update.estado = "confirmado";
    }
  }

  await supabase.from("pedidos").update(update).eq("id", tx.reference);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: ambos limpios.

- [ ] **Step 3: Commit**

```bash
git add app/api/wompi/webhook/route.ts
git commit -m "feat: webhook de Wompi confirma el pago (firma + monto + idempotencia)"
```

---

### Task 9: Página de resultado + limpieza de carrito

**Files:**
- Create: `components/order/ClearCartOnSuccess.tsx`
- Create: `app/pedido/resultado/page.tsx`

- [ ] **Step 1: Crear el componente que limpia el carrito**

`components/order/ClearCartOnSuccess.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/cart/store";

// Limpia el carrito una vez cuando el pago quedó aprobado.
export function ClearCartOnSuccess() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
```

- [ ] **Step 2: Crear la página de resultado**

`app/pedido/resultado/page.tsx`:
```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Clock, X } from "lucide-react";
import { getSupabaseService } from "@/lib/supabase/service";
import { ClearCartOnSuccess } from "@/components/order/ClearCartOnSuccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultado del pago — Savia",
  robots: { index: false },
};

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;

  let estadoPago = "pendiente";
  let referencia = "";
  if (pedido) {
    const supabase = getSupabaseService();
    const { data } = await supabase
      .from("pedidos")
      .select("referencia, estado_pago")
      .eq("id", pedido)
      .single();
    if (data) {
      estadoPago = data.estado_pago as string;
      referencia = data.referencia as string;
    }
  }

  const aprobado = estadoPago === "aprobado";
  const rechazado = estadoPago === "rechazado" || estadoPago === "error";

  return (
    <section className="py-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-primary/10 bg-surface p-8 text-center shadow-sm">
        {aprobado && <ClearCartOnSuccess />}
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          {aprobado ? (
            <Check className="h-7 w-7 text-primary" aria-hidden />
          ) : rechazado ? (
            <X className="h-7 w-7 text-accent" aria-hidden />
          ) : (
            <Clock className="h-7 w-7 text-primary" aria-hidden />
          )}
        </div>

        {aprobado && (
          <>
            <p className="mt-4 font-display text-2xl text-primary">¡Pago confirmado! 🌿</p>
            <p className="mt-2 text-ink/80">
              Tu referencia es <strong className="font-mono text-primary">{referencia}</strong>.
              Preparamos tu pedido y coordinamos el envío.
            </p>
          </>
        )}
        {!aprobado && !rechazado && (
          <>
            <p className="mt-4 font-display text-2xl text-primary">Estamos confirmando tu pago</p>
            <p className="mt-2 text-ink/80">
              Puede tardar unos segundos. Te avisaremos por WhatsApp en cuanto se confirme.
            </p>
          </>
        )}
        {rechazado && (
          <>
            <p className="mt-4 font-display text-2xl text-accent">El pago no se completó</p>
            <p className="mt-2 text-ink/80">
              No te preocupes: puedes intentarlo de nuevo o pagar por Nequi.
            </p>
          </>
        )}

        <Link
          href={rechazado ? "/pedido" : "/tienda"}
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-bg transition hover:opacity-90"
        >
          {rechazado ? "Volver a intentar" : "Volver a la tienda"}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verificar typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: los tres limpios; aparece la ruta `/pedido/resultado`.

- [ ] **Step 4: Commit**

```bash
git add components/order/ClearCartOnSuccess.tsx app/pedido/resultado/page.tsx
git commit -m "feat: página de resultado del pago Wompi"
```

---

### Task 10: `OrderForm` — selector de método + envío + redirección Wompi

**Files:**
- Modify: `components/order/OrderForm.tsx`

- [ ] **Step 1: Reemplazar el contenido de `components/order/OrderForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CreditCard, ShoppingBag, Smartphone } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { pedidoSchema, type PedidoInput } from "@/lib/order/schema";
import { crearPedido, crearPedidoWompi } from "@/lib/order/actions";
import { generateOrderRef } from "@/lib/cart/reference";
import { buildWhatsAppMessage } from "@/lib/cart/whatsapp";
import { DEPARTAMENTOS } from "@/content/colombia";
import { formatCOP } from "@/lib/utils";
import { ENVIO_COP, calcularTotal } from "@/lib/order/envio";
import { Reveal } from "@/lib/motion/Reveal";
import { NequiPayment } from "@/components/cart/NequiPayment";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";

const inputCls =
  "w-full rounded-xl border border-primary/15 bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";
const errCls = "mt-1 text-xs text-accent";

type Metodo = "nequi" | "wompi";

export function OrderForm() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const total = calcularTotal(subtotal);

  const [pay, setPay] = useState<{ customer: PedidoInput; referencia: string } | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("nequi");
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PedidoInput>({ resolver: zodResolver(pedidoSchema) });

  const onSubmit = (data: PedidoInput) => {
    setServerError(null);
    setPay((prev) => ({ customer: data, referencia: prev?.referencia ?? generateOrderRef() }));
  };

  // Nequi manual: guarda el pedido y abre WhatsApp para el comprobante.
  const confirmarNequi = async () => {
    if (!pay) return;
    setServerError(null);
    setConfirming(true);
    const res = await crearPedido(pay.customer, items, pay.referencia);
    if (!res.ok) {
      setServerError(res.error);
      setConfirming(false);
      return;
    }
    const { url } = buildWhatsAppMessage(items, pay.customer, NUMBER, res.referencia);
    window.open(url, "_blank", "noopener,noreferrer");
    clear();
    setDone(res.referencia);
  };

  // Wompi: guarda el pedido pendiente y redirige al Web Checkout.
  const pagarWompi = async () => {
    if (!pay) return;
    setServerError(null);
    setConfirming(true);
    const res = await crearPedidoWompi(pay.customer, items);
    if (!res.ok) {
      setServerError(res.error);
      setConfirming(false);
      return;
    }
    window.location.href = res.url;
  };

  if (done) {
    return (
      <Reveal className="mx-auto mt-12 max-w-lg">
        <div className="rounded-3xl border border-primary/10 bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            <Check className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <p className="mt-4 font-display text-2xl text-primary">¡Pedido registrado! 🌿</p>
          <p className="mt-2 text-ink/80">
            Tu referencia es <strong className="font-mono text-primary">{done}</strong>. Te abrimos
            WhatsApp para que nos envíes el comprobante de pago y coordinemos el envío.
          </p>
          <Link
            href="/tienda"
            className="mt-6 inline-block rounded-full border border-primary/30 px-6 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
          >
            Volver a la tienda
          </Link>
        </div>
      </Reveal>
    );
  }

  if (pay && items.length > 0) {
    return (
      <div className="mx-auto mt-10 max-w-lg space-y-5 rounded-3xl border border-primary/10 bg-surface p-6 shadow-sm sm:p-8">
        {/* Resumen con envío */}
        <div className="space-y-1.5 rounded-2xl border border-primary/10 bg-surface/50 p-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Envío nacional</span>
            <span>{formatCOP(ENVIO_COP)}</span>
          </div>
          <div className="flex justify-between border-t border-primary/10 pt-1.5 font-medium text-ink">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
        </div>

        {/* Selector de método */}
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Método de pago">
          <button
            type="button"
            role="tab"
            aria-selected={metodo === "nequi"}
            onClick={() => setMetodo("nequi")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              metodo === "nequi"
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/15 text-muted hover:bg-primary/5"
            }`}
          >
            <Smartphone className="h-4 w-4" aria-hidden />
            Nequi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metodo === "wompi"}
            onClick={() => setMetodo("wompi")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              metodo === "wompi"
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/15 text-muted hover:bg-primary/5"
            }`}
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            Tarjeta / PSE
          </button>
        </div>

        {metodo === "nequi" ? (
          <NequiPayment
            reference={pay.referencia}
            total={total}
            onConfirm={() => void confirmarNequi()}
            submitting={confirming}
            error={serverError}
          />
        ) : (
          <div className="space-y-4 text-ink">
            <p className="text-sm text-muted">
              Te llevamos a la página segura de Wompi para pagar con tarjeta o PSE. Al confirmarse el
              pago, preparamos tu pedido.
            </p>
            {serverError && <p className="text-sm text-accent">{serverError}</p>}
            <button
              type="button"
              onClick={() => void pagarWompi()}
              disabled={confirming}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {confirming ? "Redirigiendo…" : `Pagar ${formatCOP(total)} con tarjeta o PSE`}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setPay(null)}
          className="w-full text-center text-sm text-muted transition-colors hover:text-primary"
        >
          ← Volver a mis datos
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-primary/10 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          <ShoppingBag className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <p className="mt-4 text-ink/80">Tu carrito está vacío.</p>
        <Link
          href="/tienda"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-bg transition hover:opacity-90"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-5">
      {/* Resumen del carrito */}
      <aside className="md:col-span-2">
        <div className="md:sticky md:top-24">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg text-primary">Tu pedido</h2>
            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {totalQty} {totalQty === 1 ? "artículo" : "artículos"}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-surface/50 p-4">
            {items.map((i) => (
              <li key={i.slug} className="flex justify-between gap-3 py-2 text-sm">
                <span className="text-ink">
                  {i.nombre} <span className="text-muted">×{i.qty}</span>
                </span>
                <span className="shrink-0 text-muted">{formatCOP(i.precioCOP * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 px-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Envío nacional</span>
              <span>{formatCOP(ENVIO_COP)}</span>
            </div>
            <div className="flex justify-between border-t border-primary/10 pt-1 font-medium text-ink">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Formulario de envío */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-3xl border border-primary/10 bg-surface p-6 shadow-sm sm:p-8 md:col-span-3"
      >
        <h2 className="font-display text-lg text-primary">Datos de envío</h2>

        <div>
          <label className={labelCls}>Nombre completo</label>
          <input {...register("nombre")} className={inputCls} placeholder="Tu nombre" />
          {errors.nombre && <p className={errCls}>{errors.nombre.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Teléfono / WhatsApp</label>
            <input {...register("telefono")} className={inputCls} placeholder="3001112233" inputMode="tel" />
            {errors.telefono && <p className={errCls}>{errors.telefono.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Correo electrónico (opcional)</label>
            <input {...register("email")} className={inputCls} placeholder="correo@ejemplo.com" inputMode="email" />
            {errors.email && <p className={errCls}>{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Departamento</label>
            <select {...register("departamento")} defaultValue="" className={inputCls}>
              <option value="" disabled>
                Selecciona…
              </option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.departamento && <p className={errCls}>{errors.departamento.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Ciudad / Municipio</label>
            <input {...register("ciudad")} className={inputCls} placeholder="Tu ciudad" />
            {errors.ciudad && <p className={errCls}>{errors.ciudad.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Dirección de entrega</label>
          <input {...register("direccion")} className={inputCls} placeholder="Calle 1 #2-3, barrio, referencias" />
          {errors.direccion && <p className={errCls}>{errors.direccion.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Notas (opcional)</label>
          <textarea {...register("notas")} rows={3} className={inputCls} placeholder="Indicaciones para la entrega" />
        </div>

        {serverError && <p className="text-sm text-accent">{serverError}</p>}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
        >
          Continuar al pago
        </button>
        <p className="text-center text-xs text-muted">
          Tus datos solo se usan para coordinar el envío. Sin spam.
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: todo limpio y verde.

- [ ] **Step 3: Commit**

```bash
git add components/order/OrderForm.tsx
git commit -m "feat: checkout con selector Nequi/Wompi y envío en el total"
```

---

### Task 11: Admin — método y estado de pago en pedidos

**Files:**
- Modify: `lib/admin/estados.ts`
- Modify: `lib/admin/queries.ts`
- Modify: `components/admin/PedidoCard.tsx`

- [ ] **Step 1: Añadir etiquetas a `lib/admin/estados.ts`**

Añadir al final de `lib/admin/estados.ts`:
```ts
export const ESTADOS_PAGO = ["pendiente", "aprobado", "rechazado", "error"] as const;
export type EstadoPagoAdmin = (typeof ESTADOS_PAGO)[number];

export const ESTADO_PAGO_LABEL: Record<EstadoPagoAdmin, string> = {
  pendiente: "Por verificar",
  aprobado: "Pagado",
  rechazado: "Rechazado",
  error: "Error",
};

export const METODO_LABEL: Record<"manual" | "wompi", string> = {
  manual: "Nequi",
  wompi: "Wompi",
};
```

- [ ] **Step 2: Añadir los campos a `PedidoRow` en `lib/admin/queries.ts`**

Reemplazar el tipo `PedidoRow` (líneas 4–17) por:
```ts
export type PedidoRow = {
  id: string;
  created_at: string;
  referencia: string;
  nombre: string;
  telefono: string;
  email: string | null;
  departamento: string;
  ciudad: string;
  direccion: string;
  notas: string | null;
  subtotal_cop: number;
  envio_cop: number;
  total_cop: number | null;
  metodo_pago: "manual" | "wompi";
  estado_pago: "pendiente" | "aprobado" | "rechazado" | "error";
  wompi_transaction_id: string | null;
  estado: EstadoPedido;
};
```
(`getPedidos` ya hace `select("*")`, así que no requiere más cambios.)

- [ ] **Step 3: Mostrar los sellos en `components/admin/PedidoCard.tsx`**

Reemplazar la línea de import de estados (línea 3):
```tsx
import { ESTADOS, ESTADO_LABEL, ESTADO_PAGO_LABEL, METODO_LABEL } from "@/lib/admin/estados";
```

Reemplazar el bloque de la referencia (líneas 37–38, el `<div>` con la referencia) para añadir los sellos debajo de la referencia:
```tsx
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm text-primary">{pedido.referencia}</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {METODO_LABEL[pedido.metodo_pago]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                pedido.estado_pago === "aprobado"
                  ? "bg-primary/15 text-primary"
                  : pedido.estado_pago === "rechazado" || pedido.estado_pago === "error"
                    ? "bg-accent/15 text-accent"
                    : "bg-muted/15 text-muted"
              }`}
            >
              {ESTADO_PAGO_LABEL[pedido.estado_pago]}
            </span>
          </div>
          <p className="font-medium text-ink">{pedido.nombre} · {pedido.telefono}</p>
```
(Nota: este reemplazo abre el `<div>` y reemplaza la línea de la referencia; el resto del bloque —dirección, notas, fecha— queda igual, y el `<p>` del nombre ahora va dentro del nuevo markup.)

Reemplazar la línea del monto (línea 45) para mostrar el total cuando exista:
```tsx
          <p className="font-medium text-ink">{formatCOP(pedido.total_cop ?? pedido.subtotal_cop)}</p>
```

- [ ] **Step 4: Verificar typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: los tres limpios.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/estados.ts lib/admin/queries.ts components/admin/PedidoCard.tsx
git commit -m "feat(admin): sello de método y estado de pago en pedidos"
```

---

### Task 12: Verificación final

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Suite completa**

Run: `pnpm test`
Expected: PASS — incluye `envio`, `signature`, `checkout`, `webhook` y los 29 previos.

- [ ] **Step 2: Typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: los tres verdes; rutas nuevas `/pedido/resultado` y `/api/wompi/webhook` presentes.

- [ ] **Step 3: Verificación manual en sandbox (requiere claves de Wompi)**

Con `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`, `WOMPI_PRIVATE_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (sandbox) en `.env.local`:
- `pnpm dev` → `/tienda` → agrega producto → `/pedido` → "Continuar al pago".
- Verifica el resumen: Subtotal + Envío $12.000 + Total.
- Pestaña **Nequi**: muestra QR/número/referencia y total con envío; "Ya pagué" guarda el pedido y abre WhatsApp.
- Pestaña **Tarjeta/PSE**: "Pagar … con tarjeta o PSE" redirige al Web Checkout de Wompi (sandbox). Paga con tarjeta de prueba aprobada.
- Configura el webhook en el panel de Wompi apuntando a `…/api/wompi/webhook` (o usa un túnel local). Tras aprobar, el pedido en `/admin/pedidos` debe mostrar **"Pagado · Wompi"** y estado "confirmado".
- Prueba una tarjeta rechazada: `/pedido/resultado` muestra el estado rechazado y el pedido queda `rechazado`.

- [ ] **Step 4: Commit (si quedó algún ajuste)**

```bash
git add -A
git commit -m "chore: verificación final pago Wompi"
```

---

## Notas de seguridad (recordatorio para quien implementa)

- Los secretos de Wompi y la `SUPABASE_SERVICE_ROLE_KEY` son **server-only**. Solo
  `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` puede ir al cliente.
- El webhook valida **firma + monto** antes de confirmar; sin eso, nunca marca pagado.
- La RLS endurecida impide que el rol anónimo (key pública) inserte pedidos ya
  aprobados; solo el webhook (service-role) puede aprobar.
- "Pagado · Wompi" en el panel = el dinero entró; se puede despachar. Nequi manual
  se sigue verificando contra el saldo real.
