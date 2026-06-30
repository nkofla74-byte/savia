# Migración pasarela Wompi → Bold (Link de pago) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la pasarela de pagos del storefront de Wompi por Bold (producto "Link de pago"), cobrando tarjeta/PSE/Nequi, con confirmación exclusivamente por webhook firmado.

**Architecture:** Mismo patrón que Wompi (redirección + webhook). Una server action inserta el pedido `pendiente`, crea un link de pago vía la API de Bold (server-to-server) y redirige al checkout alojado de Bold. El cliente vuelve a `/pedido/resultado`, que solo muestra estado. La confirmación real la escribe el webhook `/api/bold/webhook` tras verificar la firma HMAC-SHA256 sobre el body crudo. Se elimina el método "Nequi manual" porque Bold ya cobra Nequi.

**Tech Stack:** Next.js 15 (App Router, route handlers `runtime=nodejs`), TypeScript strict, Supabase (service-role en webhook), Vitest, `node:crypto` (HMAC).

**Spec:** `docs/superpowers/specs/2026-06-29-bold-link-de-pago-design.md`

---

## Estructura de archivos

**Nuevos:**
- `lib/bold/webhook.ts` — verificación de firma + mapeo de estados + tipos del evento.
- `lib/bold/webhook.test.ts` — tests de firma y mapeo.
- `lib/bold/checkout.ts` — `crearLinkPago()`: llama a la API de Bold.
- `lib/bold/checkout.test.ts` — tests con `fetch` mockeado.
- `app/api/bold/webhook/route.ts` — endpoint del webhook.
- `supabase/migrations/20260629_savia_bold_pago.sql` — columna + constraint + RLS.

**Modificados:**
- `lib/order/actions.ts` — `crearPedidoWompi`/`crearPedido` → `crearPedidoBold`.
- `components/order/OrderForm.tsx` — un solo método "Pagar con Bold".
- `lib/admin/estados.ts` — `METODO_LABEL` incluye `bold`.
- `lib/admin/queries.ts` — tipo `metodo_pago` + `bold_payment_id`.
- `app/admin/(panel)/pedidos/[id]/page.tsx` — muestra `bold_payment_id`.
- `app/pedido/resultado/page.tsx` — copy del estado rechazado.
- `.env.example` — quita vars Wompi, añade Bold.

**Eliminados:**
- `lib/wompi/checkout.ts`, `lib/wompi/signature.ts`, `lib/wompi/webhook.ts` + tests.
- `app/api/wompi/webhook/route.ts`.
- `components/cart/NequiPayment.tsx`.

---

## Task 1: Migración DB (columna Bold + constraint + RLS)

**Files:**
- Create: `supabase/migrations/20260629_savia_bold_pago.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- Savia — Pasarela Bold (Link de pago): permite metodo_pago='bold',
-- agrega columna del id de transacción de Bold y actualiza la policy de INSERT anónimo.

-- 1) Permitir 'bold' en metodo_pago (se mantiene 'wompi' para filas históricas).
alter table public.pedidos drop constraint if exists pedidos_metodo_pago_check;
alter table public.pedidos add constraint pedidos_metodo_pago_check
  check (metodo_pago in ('manual','wompi','bold'));

-- 2) Columna para el id de transacción de Bold.
alter table public.pedidos
  add column if not exists bold_payment_id text;

-- 3) La policy de INSERT anónimo debe permitir 'bold'.
drop policy if exists "anon inserta pedidos pendientes" on public.pedidos;
create policy "anon inserta pedidos pendientes"
  on public.pedidos for insert
  to anon
  with check (
    estado = 'nuevo'
    and estado_pago = 'pendiente'
    and metodo_pago in ('manual','wompi','bold')
  );
```

- [ ] **Step 2: Aplicar la migración a Supabase**

Aplicar vía el MCP de Supabase con `apply_migration` (name: `savia_bold_pago`, query: contenido del archivo). Proyecto: `savia` (ref `nkywfkwztppkgbqnmkax`).

- [ ] **Step 3: Verificar que la columna y el constraint existen**

Ejecutar vía `execute_sql`:
```sql
select column_name from information_schema.columns
where table_name = 'pedidos' and column_name = 'bold_payment_id';
```
Esperado: una fila con `bold_payment_id`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260629_savia_bold_pago.sql
git commit -m "feat(pagos): migración DB para pasarela Bold (metodo_pago, bold_payment_id, RLS)"
```

---

## Task 2: lib/bold/webhook.ts (firma + mapeo de estados)

**Files:**
- Create: `lib/bold/webhook.ts`
- Test: `lib/bold/webhook.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/bold/webhook.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verificarFirmaBold, mapEstadoPagoBold } from "./webhook";

const SECRET = "bold_secret";

function firmar(body: string, secret: string): string {
  const encoded = Buffer.from(body, "utf8").toString("base64");
  return createHmac("sha256", secret).update(encoded).digest("hex");
}

describe("verificarFirmaBold", () => {
  const body = JSON.stringify({ type: "SALE_APPROVED", data: { metadata: { reference: "uuid-1" } } });

  it("acepta una firma válida", () => {
    expect(verificarFirmaBold(body, firmar(body, SECRET), SECRET)).toBe(true);
  });

  it("rechaza una firma inválida", () => {
    expect(verificarFirmaBold(body, firmar(body, "otro"), SECRET)).toBe(false);
  });

  it("rechaza cuando falta la firma", () => {
    expect(verificarFirmaBold(body, null, SECRET)).toBe(false);
  });

  it("acepta firma con secreto vacío (modo pruebas de Bold)", () => {
    expect(verificarFirmaBold(body, firmar(body, ""), "")).toBe(true);
  });
});

describe("mapEstadoPagoBold", () => {
  it("mapea los tipos de Bold a nuestros estados", () => {
    expect(mapEstadoPagoBold("SALE_APPROVED")).toBe("aprobado");
    expect(mapEstadoPagoBold("SALE_REJECTED")).toBe("rechazado");
    expect(mapEstadoPagoBold("VOID_APPROVED")).toBe("rechazado");
    expect(mapEstadoPagoBold("VOID_REJECTED")).toBe("pendiente");
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm test lib/bold/webhook.test.ts`
Expected: FAIL — no existe `./webhook`.

- [ ] **Step 3: Implementar `lib/bold/webhook.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export type BoldEvent = {
  id: string;
  type: string;
  subject?: string;
  data: {
    payment_id?: string;
    amount?: { currency: string; total: number };
    metadata?: { reference?: string };
    payment_method?: string;
  };
};

export type EstadoPago = "aprobado" | "rechazado" | "pendiente" | "error";

// Firma de Bold: HMAC-SHA256 (hex) de base64(body crudo) con la llave secreta.
// En modo pruebas Bold usa una clave vacía. Confirmar contra la doc vigente.
export function verificarFirmaBold(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const encoded = Buffer.from(rawBody, "utf8").toString("base64");
  const calculado = createHmac("sha256", secret).update(encoded).digest("hex");
  const a = Buffer.from(calculado);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function mapEstadoPagoBold(type: string): EstadoPago {
  switch (type) {
    case "SALE_APPROVED":
      return "aprobado";
    case "SALE_REJECTED":
    case "VOID_APPROVED":
      return "rechazado";
    default:
      return "pendiente";
  }
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm test lib/bold/webhook.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/bold/webhook.ts lib/bold/webhook.test.ts
git commit -m "feat(bold): verificación de firma del webhook y mapeo de estados"
```

---

## Task 3: lib/bold/checkout.ts (crear link de pago)

**Files:**
- Create: `lib/bold/checkout.ts`
- Test: `lib/bold/checkout.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`lib/bold/checkout.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { crearLinkPago } from "./checkout";

function okResponse(payload: unknown): Response {
  return { ok: true, json: async () => ({ payload }) } as Response;
}

const base = {
  apiKey: "id_key",
  amountCop: 49000,
  reference: "uuid-1",
  description: "Pedido Savia SAVIA-7X2K",
  callbackUrl: "https://savia.co/pedido/resultado?pedido=uuid-1",
};

describe("crearLinkPago", () => {
  it("devuelve la url cuando Bold responde ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      okResponse({ url: "https://checkout.bold.co/LNK_1", payment_link: "LNK_1" }),
    );
    const res = await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    expect(res).toEqual({ ok: true, url: "https://checkout.bold.co/LNK_1", paymentLink: "LNK_1" });
  });

  it("envía COP sin convertir a centavos, métodos y auth correctos", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({ url: "u", payment_link: "LNK_1" }));
    await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    const [endpoint, init] = fetchFn.mock.calls[0];
    expect(endpoint).toBe("https://integrations.api.bold.co/online/link/v1");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.amount.total_amount).toBe(49000);
    expect(sent.amount.currency).toBe("COP");
    expect(sent.amount_type).toBe("CLOSE");
    expect(sent.payment_methods).toEqual(["CREDIT_CARD", "PSE", "NEQUI"]);
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "x-api-key id_key" });
  });

  it("devuelve error cuando Bold responde con error http", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    const res = await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    expect(res.ok).toBe(false);
  });

  it("devuelve error cuando falta la url en la respuesta", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({ payment_link: "LNK_1" }));
    const res = await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm test lib/bold/checkout.test.ts`
Expected: FAIL — no existe `./checkout`.

- [ ] **Step 3: Implementar `lib/bold/checkout.ts`**

```ts
export type CrearLinkPagoParams = {
  apiKey: string;
  amountCop: number;
  reference: string;
  description: string;
  callbackUrl: string;
  payerEmail?: string;
  expirationMs?: number; // epoch ms de expiración; default now + 1h
};

export type CrearLinkPagoResult =
  | { ok: true; url: string; paymentLink: string }
  | { ok: false; error: string };

const BOLD_LINK_ENDPOINT = "https://integrations.api.bold.co/online/link/v1";

export async function crearLinkPago(
  p: CrearLinkPagoParams,
  fetchFn: typeof fetch = fetch,
): Promise<CrearLinkPagoResult> {
  const expMs = p.expirationMs ?? Date.now() + 60 * 60 * 1000;
  const body = {
    amount_type: "CLOSE",
    amount: { currency: "COP", total_amount: p.amountCop },
    reference: p.reference,
    description: p.description,
    callback_url: p.callbackUrl,
    payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"],
    expiration_date: expMs * 1_000_000, // Bold espera nanosegundos
    ...(p.payerEmail ? { payer_email: p.payerEmail } : {}),
  };

  let res: Response;
  try {
    res = await fetchFn(BOLD_LINK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `x-api-key ${p.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con la pasarela de pago." };
  }

  if (!res.ok) {
    return { ok: false, error: "La pasarela de pago rechazó la solicitud." };
  }

  const json = (await res.json()) as {
    payload?: { url?: string; payment_link?: string };
  };
  const url = json.payload?.url;
  const paymentLink = json.payload?.payment_link;
  if (!url || !paymentLink) {
    return { ok: false, error: "La pasarela no devolvió un link de pago válido." };
  }
  return { ok: true, url, paymentLink };
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm test lib/bold/checkout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/bold/checkout.ts lib/bold/checkout.test.ts
git commit -m "feat(bold): creación de link de pago vía API"
```

---

## Task 4: Webhook route `/api/bold/webhook`

**Files:**
- Create: `app/api/bold/webhook/route.ts`

- [ ] **Step 1: Implementar el route handler**

```ts
import { NextResponse } from "next/server";
import { verificarFirmaBold, mapEstadoPagoBold, type BoldEvent } from "@/lib/bold/webhook";
import { getSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

const SECRET = process.env.BOLD_SECRET_KEY ?? "";

export async function POST(req: Request) {
  // La firma se calcula sobre el body CRUDO: leer texto, no reserializar JSON.
  const raw = await req.text();
  const signature = req.headers.get("x-bold-signature");

  if (!verificarFirmaBold(raw, signature, SECRET)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let event: BoldEvent;
  try {
    event = JSON.parse(raw) as BoldEvent;
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const reference = event.data?.metadata?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  const supabase = getSupabaseService();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, total_cop, estado_pago")
    .eq("id", reference)
    .single();

  if (!pedido) return NextResponse.json({ ok: true });
  // Idempotencia: si ya está aprobado, no reprocesar.
  if (pedido.estado_pago === "aprobado") return NextResponse.json({ ok: true });

  const estadoPago = mapEstadoPagoBold(event.type);
  const update: Record<string, unknown> = {
    estado_pago: estadoPago,
    bold_payment_id: event.data?.payment_id ?? null,
  };

  if (estadoPago === "aprobado") {
    // Cruzar monto (COP, sin centavos). Si no coincide, marcar error (no despachar).
    const montoBold = event.data?.amount?.total;
    if (pedido.total_cop != null && montoBold !== pedido.total_cop) {
      update.estado_pago = "error";
    } else {
      update.estado = "confirmado";
    }
  }

  await supabase.from("pedidos").update(update).eq("id", reference);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/bold/webhook/route.ts
git commit -m "feat(bold): webhook que confirma pagos y cruza monto"
```

---

## Task 5: Server action `crearPedidoBold`

**Files:**
- Modify: `lib/order/actions.ts` (reemplazo del archivo completo)

- [ ] **Step 1: Reescribir `lib/order/actions.ts`**

Reemplazar TODO el contenido por:
```ts
"use server";
import { pedidoSchema, type PedidoInput } from "./schema";
import { ENVIO_COP, calcularTotal } from "./envio";
import type { CartItem } from "@/lib/cart/store";
import { getSupabaseServer } from "@/lib/supabase/server";
import { generateOrderRef } from "@/lib/cart/reference";
import { crearLinkPago } from "@/lib/bold/checkout";

export type CrearPedidoBoldResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function subtotalDe(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
}

async function insertarPedido(
  parsed: PedidoInput,
  items: CartItem[],
  opts: { referencia: string },
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
    metodo_pago: "bold",
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

// Flujo Bold: guarda el pedido pendiente y devuelve la URL del Link de pago.
export async function crearPedidoBold(
  input: PedidoInput,
  items: CartItem[],
): Promise<CrearPedidoBoldResult> {
  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de envío inválidos." };
  if (items.length === 0) return { ok: false, error: "El carrito está vacío." };

  const apiKey = process.env.BOLD_API_KEY ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!apiKey) {
    return { ok: false, error: "El pago no está disponible por ahora." };
  }

  const referencia = generateOrderRef();
  const res = await insertarPedido(parsed.data, items, { referencia });
  if (!res.ok) return res;

  // La referencia que viaja a Bold es el uuid del pedido (única, sin colisiones).
  const link = await crearLinkPago({
    apiKey,
    amountCop: res.total,
    reference: res.id,
    description: `Pedido Savia ${referencia}`,
    callbackUrl: `${siteUrl}/pedido/resultado?pedido=${res.id}`,
    payerEmail: parsed.data.email || undefined,
  });
  if (!link.ok) return { ok: false, error: link.error };
  return { ok: true, url: link.url };
}
```

- [ ] **Step 2: Verificar typecheck (fallará en OrderForm hasta Task 6)**

Run: `pnpm typecheck`
Expected: errores SOLO en `components/order/OrderForm.tsx` (usa `crearPedido`/`crearPedidoWompi` ya eliminados). Es esperado; se corrige en Task 6.

- [ ] **Step 3: Commit**

```bash
git add lib/order/actions.ts
git commit -m "feat(bold): server action crearPedidoBold (reemplaza Wompi y Nequi manual)"
```

---

## Task 6: OrderForm con un solo método (Bold)

**Files:**
- Modify: `components/order/OrderForm.tsx` (reemplazo del archivo completo)

- [ ] **Step 1: Reescribir `components/order/OrderForm.tsx`**

Reemplazar TODO el contenido por:
```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { pedidoSchema, type PedidoInput } from "@/lib/order/schema";
import { crearPedidoBold } from "@/lib/order/actions";
import { DEPARTAMENTOS } from "@/content/colombia";
import { formatCOP } from "@/lib/utils";
import { ENVIO_COP, calcularTotal } from "@/lib/order/envio";

const inputCls =
  "w-full rounded-xl border border-primary/15 bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";
const errCls = "mt-1 text-xs text-accent";

export function OrderForm() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const total = calcularTotal(subtotal);

  const [pay, setPay] = useState<PedidoInput | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PedidoInput>({ resolver: zodResolver(pedidoSchema) });

  const onSubmit = (data: PedidoInput) => {
    setServerError(null);
    setPay(data);
  };

  // Bold: guarda el pedido pendiente y redirige al Link de pago.
  const pagarBold = async () => {
    if (!pay) return;
    setServerError(null);
    setConfirming(true);
    const res = await crearPedidoBold(pay, items);
    if (!res.ok) {
      setServerError(res.error);
      setConfirming(false);
      return;
    }
    window.location.href = res.url;
  };

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

        <div className="space-y-4 text-ink">
          <p className="text-sm text-muted">
            Te llevamos a la página segura de Bold para pagar con tarjeta, PSE o Nequi. Al confirmarse
            el pago, preparamos tu pedido.
          </p>
          {serverError && <p className="text-sm text-accent">{serverError}</p>}
          <button
            type="button"
            onClick={() => void pagarBold()}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {confirming ? "Redirigiendo…" : `Pagar ${formatCOP(total)} con Bold`}
          </button>
        </div>

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

- [ ] **Step 2: Verificar typecheck y lint**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/order/OrderForm.tsx
git commit -m "feat(checkout): un solo método de pago con Bold (tarjeta/PSE/Nequi)"
```

---

## Task 7: Admin + página de resultado

**Files:**
- Modify: `lib/admin/queries.ts:19-21`
- Modify: `lib/admin/estados.ts:61-64`
- Modify: `app/admin/(panel)/pedidos/[id]/page.tsx:127-129`
- Modify: `app/pedido/resultado/page.tsx`

- [ ] **Step 1: Tipos en `lib/admin/queries.ts`**

Reemplazar:
```ts
  metodo_pago: "manual" | "wompi";
  estado_pago: "pendiente" | "aprobado" | "rechazado" | "error";
  wompi_transaction_id: string | null;
```
por:
```ts
  metodo_pago: "manual" | "wompi" | "bold";
  estado_pago: "pendiente" | "aprobado" | "rechazado" | "error";
  wompi_transaction_id: string | null;
  bold_payment_id: string | null;
```

- [ ] **Step 2: Label en `lib/admin/estados.ts`**

Reemplazar:
```ts
export const METODO_LABEL: Record<"manual" | "wompi", string> = {
  manual: "Nequi",
  wompi: "Wompi",
};
```
por:
```ts
export const METODO_LABEL: Record<"manual" | "wompi" | "bold", string> = {
  manual: "Nequi",
  wompi: "Wompi",
  bold: "Bold",
};
```

- [ ] **Step 3: Detalle del pedido — mostrar id de Bold**

En `app/admin/(panel)/pedidos/[id]/page.tsx`, reemplazar el bloque:
```tsx
              {pedido.wompi_transaction_id && (
                <div className="flex justify-between gap-3"><dt className="text-muted">Wompi</dt><dd className="truncate font-mono text-xs text-ink/70">{pedido.wompi_transaction_id}</dd></div>
              )}
```
por:
```tsx
              {pedido.bold_payment_id && (
                <div className="flex justify-between gap-3"><dt className="text-muted">Bold</dt><dd className="truncate font-mono text-xs text-ink/70">{pedido.bold_payment_id}</dd></div>
              )}
              {pedido.wompi_transaction_id && (
                <div className="flex justify-between gap-3"><dt className="text-muted">Wompi</dt><dd className="truncate font-mono text-xs text-ink/70">{pedido.wompi_transaction_id}</dd></div>
              )}
```

- [ ] **Step 4: Verificar que la query `select` trae `bold_payment_id`**

En `lib/admin/queries.ts`, buscar el `.select(...)` de la consulta de detalle de pedido. Si lista columnas explícitas e incluye `wompi_transaction_id`, agregar `bold_payment_id` a esa lista. Si usa `select("*")`, no hay cambio.

Run: `grep -n "wompi_transaction_id\|select(" lib/admin/queries.ts`
Acción: añadir `bold_payment_id` junto a `wompi_transaction_id` si aparece en un `.select` explícito.

- [ ] **Step 5: Copy en `app/pedido/resultado/page.tsx`**

Reemplazar:
```tsx
            <p className="mt-2 text-ink/80">
              No te preocupes: puedes intentarlo de nuevo o pagar por Nequi.
            </p>
```
por:
```tsx
            <p className="mt-2 text-ink/80">
              No te preocupes: puedes intentarlo de nuevo.
            </p>
```

- [ ] **Step 6: Verificar typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add lib/admin/queries.ts lib/admin/estados.ts "app/admin/(panel)/pedidos/[id]/page.tsx" app/pedido/resultado/page.tsx
git commit -m "feat(admin): mostrar pago Bold en pedidos y ajustar copy de resultado"
```

---

## Task 8: Eliminar Wompi + Nequi manual + actualizar .env.example

**Files:**
- Delete: `lib/wompi/checkout.ts`, `lib/wompi/checkout.test.ts`, `lib/wompi/signature.ts`, `lib/wompi/webhook.ts`, `lib/wompi/webhook.test.ts`
- Delete: `app/api/wompi/webhook/route.ts` (y carpeta `app/api/wompi` si queda vacía)
- Delete: `components/cart/NequiPayment.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Confirmar que NequiPayment y lib/wompi quedaron sin referencias**

Run: `grep -rn "NequiPayment\|lib/wompi\|@/lib/wompi\|crearPedidoWompi\|crearPedido\b" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v "lib/wompi/"`
Expected: sin resultados (fuera de los propios archivos a eliminar).

- [ ] **Step 2: Eliminar archivos Wompi y NequiPayment**

```bash
git rm lib/wompi/checkout.ts lib/wompi/checkout.test.ts lib/wompi/signature.ts lib/wompi/webhook.ts lib/wompi/webhook.test.ts
git rm app/api/wompi/webhook/route.ts
git rm components/cart/NequiPayment.tsx
```

- [ ] **Step 3: Confirmar si `NEXT_PUBLIC_NEQUI_NUMBER` quedó sin uso**

Run: `grep -rn "NEQUI_NUMBER" --include="*.ts" --include="*.tsx" . | grep -v node_modules`
Si no hay resultados en código (solo en `.env.example`), se elimina del ejemplo en el siguiente paso. Si aparece en código, dejarlo.

- [ ] **Step 4: Actualizar `.env.example`**

Reemplazar el bloque (líneas 10-16):
```
# Wompi (pasarela de pagos). Empieza con claves sandbox (pub_test_/prv_test_).
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxx
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_INTEGRITY_SECRET=test_integrity_xxx
WOMPI_EVENTS_SECRET=test_events_xxx
# Supabase service-role (SOLO servidor: usada por el webhook de Wompi). Nunca NEXT_PUBLIC.
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```
por:
```
# Bold (pasarela de pagos — Link de pago). NUNCA NEXT_PUBLIC.
# Identidad: header x-api-key para crear links. Secreta: HMAC del webhook.
BOLD_API_KEY=TU_LLAVE_DE_IDENTIDAD
BOLD_SECRET_KEY=TU_LLAVE_SECRETA
# Supabase service-role (SOLO servidor: usada por el webhook de Bold). Nunca NEXT_PUBLIC.
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```
Si en el Step 3 `NEXT_PUBLIC_NEQUI_NUMBER` resultó sin uso, eliminar también las líneas 2-3 (comentario + `NEXT_PUBLIC_NEQUI_NUMBER`).

- [ ] **Step 5: Verificar typecheck, lint y build**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(pagos): eliminar Wompi y Nequi manual; .env.example a Bold"
```

---

## Task 9: Verificación final

- [ ] **Step 1: Suite completa**

Run: `pnpm test`
Expected: todos los tests pasan (incluye los nuevos de `lib/bold/*`, sin los de `lib/wompi/*`).

- [ ] **Step 2: Typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build exitoso; la ruta `/api/bold/webhook` aparece compilada y `/api/wompi/webhook` ya no.

- [ ] **Step 3: Prueba manual (requiere llaves y webhook registrado)**

1. `.env.local` con `BOLD_API_KEY`, `BOLD_SECRET_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
2. `pnpm dev`, agregar un producto al carrito, ir a `/pedido`, llenar datos, "Continuar al pago", "Pagar con Bold".
3. Verificar redirección al checkout de Bold (ambiente de pruebas).
4. Tras pagar/simular, confirmar que el webhook actualizó `estado_pago` (revisar `pedidos` en Supabase) y que `/pedido/resultado?pedido=<id>` muestra el estado correcto.

- [ ] **Step 4: Commit final (si hubo ajustes manuales)**

```bash
git add -A
git commit -m "test(bold): verificación de integración de pasarela Bold"
```

---

## Pasos manuales fuera del código (responsabilidad del dueño)

1. **Service-role de Supabase**: agregar `SUPABASE_SERVICE_ROLE_KEY` a `.env.local` (falta hoy). Se obtiene en Supabase → Project Settings → API → `service_role` (clave secreta).
2. **Llaves Bold**: ya en `.env.local` (`BOLD_API_KEY`, `BOLD_SECRET_KEY`).
3. **Registrar webhook** `https://<dominio>/api/bold/webhook` en *Integraciones* del panel de Bold.
4. **Producción**: cargar `BOLD_API_KEY`, `BOLD_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en las env vars del hosting (Vercel).
5. **Seguridad**: rotar las llaves de Bold compartidas por chat una vez validada la integración.
