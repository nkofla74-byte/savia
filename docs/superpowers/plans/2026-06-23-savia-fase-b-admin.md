# Fase B — Panel admin (Supabase Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Panel `/admin` protegido por magic link donde la dueña ve y gestiona pedidos (estado, eliminar) y mensajes (leído, eliminar).

**Architecture:** Supabase Auth (magic link) con `@supabase/ssr` (sesión en cookies). Autorización por tabla `admins` + función `is_admin()`. RLS otorga select/update/delete sólo a `authenticated` que sea admin (barrera real); middleware protege `/admin/*` (primera capa). Login/callback van fuera del layout protegido (route group `(panel)`) para evitar bucle de redirección.

**Tech Stack:** Next.js 16 (App Router, Server Actions, middleware), TypeScript strict, `@supabase/ssr`, Supabase (Postgres + RLS + Auth), Tailwind (tokens), Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-23-savia-backend-supabase-fase-b-admin-design.md`

**Project Supabase:** `savia` (id `nkywfkwztppkgbqnmkax`). Env ya configuradas en `.env.local`.

**Package manager:** `pnpm`. Ejecutar desde `/home/jrxdevs/savia`.

---

## File Structure

```
supabase/migrations/20260623_savia_fase_b_admin.sql   # admins, is_admin(), leido, RLS admin
lib/admin/estados.ts            # ESTADOS + helpers (TDD)
lib/admin/estados.test.ts
lib/supabase/client.ts          # createBrowserClient
lib/supabase/server-ssr.ts      # createServerClient con cookies (sesión)
lib/supabase/middleware.ts      # updateSession helper
lib/admin/auth.ts               # getAdminUser()
lib/admin/queries.ts            # lecturas (pedidos, mensajes, resumen)
lib/admin/actions.ts            # Server Actions (estado, eliminar, leído, signOut)
middleware.ts                   # protege /admin
app/admin/login/page.tsx        # login (fuera del guard)
app/admin/auth/callback/route.ts# intercambia code por sesión (fuera del guard)
app/admin/(panel)/layout.tsx    # guard + nav + cerrar sesión
app/admin/(panel)/page.tsx      # resumen
app/admin/(panel)/pedidos/page.tsx
app/admin/(panel)/mensajes/page.tsx
```

---

### Task 1: Instalar `@supabase/ssr`

**Files:** `package.json`.

- [ ] **Step 1: Instalar**

```bash
pnpm add @supabase/ssr
```

- [ ] **Step 2: Verificar**

Run: `pnpm ls @supabase/ssr`
Expected: aparece con versión.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @supabase/ssr"
```

---

### Task 2: `lib/admin/estados.ts` (TDD)

**Files:** Create `lib/admin/estados.ts`, `lib/admin/estados.test.ts`.

- [ ] **Step 1: Test que falla**

`lib/admin/estados.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ESTADOS, esEstadoValido, ESTADO_LABEL } from "./estados";

describe("estados de pedido", () => {
  it("tiene los 5 estados en orden", () => {
    expect(ESTADOS).toEqual(["nuevo", "confirmado", "enviado", "entregado", "cancelado"]);
  });
  it("valida estados conocidos y rechaza desconocidos", () => {
    expect(esEstadoValido("enviado")).toBe(true);
    expect(esEstadoValido("perdido")).toBe(false);
  });
  it("tiene etiqueta para cada estado", () => {
    for (const e of ESTADOS) expect(ESTADO_LABEL[e].length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Correr → falla**

Run: `pnpm test lib/admin/estados.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

`lib/admin/estados.ts`:
```ts
export const ESTADOS = ["nuevo", "confirmado", "enviado", "entregado", "cancelado"] as const;
export type EstadoPedido = (typeof ESTADOS)[number];

export function esEstadoValido(value: string): value is EstadoPedido {
  return (ESTADOS as readonly string[]).includes(value);
}

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
```

- [ ] **Step 4: Correr → pasa**

Run: `pnpm test lib/admin/estados.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/admin/estados.ts lib/admin/estados.test.ts
git commit -m "feat: estados de pedido + helpers (admin)"
```

---

### Task 3: Migración DB — admins, is_admin(), leido, RLS admin

**Files:** Create `supabase/migrations/20260623_savia_fase_b_admin.sql`.

- [ ] **Step 1: Escribir la migración**

`supabase/migrations/20260623_savia_fase_b_admin.sql`:
```sql
-- Fase B: autorización de admin + RLS de gestión.

create table if not exists public.admins ( email text primary key );
alter table public.admins enable row level security;

-- el admin puede ver su propia fila (para verificar en la app)
create policy "admin ve su propia fila" on public.admins
  for select to authenticated using (email = auth.jwt() ->> 'email');

-- correo del admin (PLACEHOLDER — reemplazar por el real)
insert into public.admins (email) values ('CORREO_ADMIN_PLACEHOLDER')
  on conflict do nothing;

create or replace function public.is_admin() returns boolean
  language sql security definer stable
  set search_path = public as $$
    select exists (select 1 from public.admins a where a.email = auth.jwt() ->> 'email');
  $$;

alter table public.mensajes add column if not exists leido boolean not null default false;

-- is_admin() envuelto en (select …) para que se evalúe una vez por query
-- (best practice de rendimiento de Supabase, evita reevaluación por fila).
create policy "admin lee mensajes"   on public.mensajes     for select to authenticated using ((select public.is_admin()));
create policy "admin act. mensajes"  on public.mensajes     for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra mensajes" on public.mensajes     for delete to authenticated using ((select public.is_admin()));
create policy "admin lee pedidos"    on public.pedidos      for select to authenticated using ((select public.is_admin()));
create policy "admin act. pedidos"   on public.pedidos      for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin borra pedidos"  on public.pedidos      for delete to authenticated using ((select public.is_admin()));
create policy "admin lee items"      on public.pedido_items for select to authenticated using ((select public.is_admin()));
create policy "admin borra items"    on public.pedido_items for delete to authenticated using ((select public.is_admin()));
```

- [ ] **Step 2: Aplicar la migración**

Aplicar al proyecto `savia` (id `nkywfkwztppkgbqnmkax`) con la herramienta MCP `apply_migration` (name: `savia_fase_b_admin`, query: el contenido del archivo). Si no hay MCP, pegar el SQL en el SQL Editor del dashboard de Supabase.
Expected: `{"success": true}`.

- [ ] **Step 3: Reemplazar el correo del admin**

Sustituir `CORREO_ADMIN_PLACEHOLDER` por el correo real. Vía MCP `execute_sql`:
```sql
insert into public.admins (email) values ('TU_CORREO_REAL@dominio.com') on conflict do nothing;
delete from public.admins where email = 'CORREO_ADMIN_PLACEHOLDER';
```

- [ ] **Step 4: Verificar advisors**

Usar MCP `get_advisors` (type: security). Expected: sin nuevas alertas críticas (las tablas siguen con RLS).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260623_savia_fase_b_admin.sql
git commit -m "feat: migración Fase B (admins, is_admin, RLS admin, leido)"
```

---

### Task 4: Clientes Supabase con cookies (`@supabase/ssr`)

**Files:** Create `lib/supabase/client.ts`, `lib/supabase/server-ssr.ts`, `lib/supabase/middleware.ts`.

- [ ] **Step 1: Cliente de navegador**

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Cliente de servidor (cookies)**

`lib/supabase/server-ssr.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: ignorar (el middleware refresca).
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Helper de middleware**

`lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esRutaProtegida =
    path.startsWith("/admin") &&
    !path.startsWith("/admin/login") &&
    !path.startsWith("/admin/auth");

  if (esRutaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server-ssr.ts lib/supabase/middleware.ts
git commit -m "feat: clientes Supabase con cookies (ssr)"
```

---

### Task 5: `middleware.ts` (protege /admin)

**Files:** Create `middleware.ts` (raíz del repo).

- [ ] **Step 1: Implementar**

`middleware.ts`:
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: compila; aparece middleware en la salida.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: middleware protege /admin"
```

---

### Task 6: Auth helper + login + callback

**Files:** Create `lib/admin/auth.ts`, `app/admin/login/page.tsx`, `app/admin/auth/callback/route.ts`.

- [ ] **Step 1: Helper de sesión admin**

`lib/admin/auth.ts`:
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import type { User } from "@supabase/supabase-js";

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase.from("admins").select("email").eq("email", user.email).maybeSingle();
  return data ? user : null;
}
```

- [ ] **Step 2: Página de login**

`app/admin/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${SITE}/admin/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError("No se pudo enviar el enlace. Verifica el correo.");
      return;
    }
    setSent(true);
  };

  return (
    <section className="mx-auto max-w-sm py-24">
      <h1 className="font-display text-3xl font-bold text-primary">Panel Savia</h1>
      {sent ? (
        <p className="mt-6 rounded-xl border border-primary/10 bg-surface p-6 text-ink/80">
          Te enviamos un enlace de acceso a <strong>{email}</strong>. Revisa tu correo.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar enlace de acceso"}
          </button>
        </form>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Callback**

`app/admin/auth/callback/route.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/admin`);
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/auth.ts app/admin/login/page.tsx app/admin/auth/callback/route.ts
git commit -m "feat: login admin (magic link) + callback"
```

---

### Task 7: Queries de lectura

**Files:** Create `lib/admin/queries.ts`.

- [ ] **Step 1: Implementar lecturas**

`lib/admin/queries.ts`:
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import type { EstadoPedido } from "./estados";

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
  estado: EstadoPedido;
};

export type PedidoItemRow = {
  id: string;
  pedido_id: string;
  slug: string;
  nombre: string;
  precio_cop: number;
  qty: number;
};

export type MensajeRow = {
  id: string;
  created_at: string;
  nombre: string;
  email: string | null;
  telefono: string;
  asunto: string;
  mensaje: string;
  leido: boolean;
};

export async function getPedidos(opts: { q?: string; estado?: string } = {}): Promise<PedidoRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("pedidos").select("*").order("created_at", { ascending: false });
  if (opts.estado) query = query.eq("estado", opts.estado);
  if (opts.q) query = query.or(`referencia.ilike.%${opts.q}%,nombre.ilike.%${opts.q}%`);
  const { data } = await query;
  return (data as PedidoRow[] | null) ?? [];
}

export async function getItemsDePedidos(pedidoIds: string[]): Promise<PedidoItemRow[]> {
  if (pedidoIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pedido_items").select("*").in("pedido_id", pedidoIds);
  return (data as PedidoItemRow[] | null) ?? [];
}

export async function getMensajes(opts: { soloNoLeidos?: boolean } = {}): Promise<MensajeRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("mensajes").select("*").order("created_at", { ascending: false });
  if (opts.soloNoLeidos) query = query.eq("leido", false);
  const { data } = await query;
  return (data as MensajeRow[] | null) ?? [];
}

export async function getResumen(): Promise<{ pedidos: number; nuevos: number; mensajesNoLeidos: number }> {
  const supabase = await createSupabaseServerClient();
  const [pedidos, nuevos, mensajes] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "nuevo"),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false),
  ]);
  return {
    pedidos: pedidos.count ?? 0,
    nuevos: nuevos.count ?? 0,
    mensajesNoLeidos: mensajes.count ?? 0,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/admin/queries.ts
git commit -m "feat: queries de lectura del panel admin"
```

---

### Task 8: Server Actions de gestión

**Files:** Create `lib/admin/actions.ts`.

- [ ] **Step 1: Implementar**

`lib/admin/actions.ts`:
```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";
import { esEstadoValido } from "./estados";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function cambiarEstadoPedido(id: string, estado: string): Promise<ActionResult> {
  if (!esEstadoValido(estado)) return { ok: false, error: "Estado inválido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el estado." };
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function eliminarPedido(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el pedido." };
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function marcarMensajeLeido(id: string, leido: boolean): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mensajes").update({ leido }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el mensaje." };
  revalidatePath("/admin/mensajes");
  return { ok: true };
}

export async function eliminarMensaje(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mensajes").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el mensaje." };
  revalidatePath("/admin/mensajes");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/admin/actions.ts
git commit -m "feat: server actions del panel admin"
```

---

### Task 9: Layout protegido (route group `(panel)`)

**Files:** Create `app/admin/(panel)/layout.tsx`.

- [ ] **Step 1: Implementar guard + nav**

`app/admin/(panel)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 pb-4">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin" className="text-ink/80 hover:text-primary">Resumen</Link>
          <Link href="/admin/pedidos" className="text-ink/80 hover:text-primary">Pedidos</Link>
          <Link href="/admin/mensajes" className="text-ink/80 hover:text-primary">Mensajes</Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="rounded-full border border-primary/30 px-4 py-1.5 text-sm text-primary hover:bg-primary/10">
            Cerrar sesión
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(panel)/layout.tsx"
git commit -m "feat: layout protegido del panel admin"
```

---

### Task 10: Vista resumen

**Files:** Create `app/admin/(panel)/page.tsx`.

- [ ] **Step 1: Implementar**

`app/admin/(panel)/page.tsx`:
```tsx
import Link from "next/link";
import { getResumen } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminResumenPage() {
  const r = await getResumen();
  const cards = [
    { label: "Pedidos totales", value: r.pedidos, href: "/admin/pedidos" },
    { label: "Pedidos nuevos", value: r.nuevos, href: "/admin/pedidos?estado=nuevo" },
    { label: "Mensajes sin leer", value: r.mensajesNoLeidos, href: "/admin/mensajes?noleidos=1" },
  ];
  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Resumen</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-primary/10 bg-surface/50 p-6 transition-transform hover:-translate-y-1">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{c.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(panel)/page.tsx"
git commit -m "feat: vista resumen del panel admin"
```

---

### Task 11: Vista de pedidos (buscar, filtrar, estado, eliminar)

**Files:** Create `app/admin/(panel)/pedidos/page.tsx`, `components/admin/PedidoCard.tsx`.

- [ ] **Step 1: Componente de pedido (cliente: cambia estado + elimina)**

`components/admin/PedidoCard.tsx`:
```tsx
"use client";
import { useState } from "react";
import { ESTADOS, ESTADO_LABEL } from "@/lib/admin/estados";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/admin/actions";
import { formatCOP } from "@/lib/utils";
import type { PedidoRow, PedidoItemRow } from "@/lib/admin/queries";

export function PedidoCard({ pedido, items }: { pedido: PedidoRow; items: PedidoItemRow[] }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onEstado = async (nuevo: string) => {
    setBusy(true);
    setError(null);
    const prev = estado;
    setEstado(nuevo as typeof estado);
    const res = await cambiarEstadoPedido(pedido.id, nuevo);
    setBusy(false);
    if (!res.ok) {
      setEstado(prev);
      setError(res.error);
    }
  };

  const onEliminar = async () => {
    if (!confirm(`¿Eliminar el pedido ${pedido.referencia}? Esta acción es irreversible.`)) return;
    setBusy(true);
    const res = await eliminarPedido(pedido.id);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="rounded-2xl border border-primary/10 bg-surface/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-primary">{pedido.referencia}</p>
          <p className="font-medium text-ink">{pedido.nombre} · {pedido.telefono}</p>
          <p className="text-sm text-muted">{pedido.departamento} · {pedido.ciudad} · {pedido.direccion}</p>
          {pedido.notas && <p className="text-sm text-muted">Notas: {pedido.notas}</p>}
          <p className="mt-1 text-xs text-muted">{new Date(pedido.created_at).toLocaleString("es-CO")}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-ink">{formatCOP(pedido.subtotal_cop)}</p>
          <select
            value={estado}
            disabled={busy}
            onChange={(e) => void onEstado(e.target.value)}
            className="mt-2 rounded-lg border border-primary/20 bg-surface px-2 py-1 text-sm text-ink"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
            ))}
          </select>
        </div>
      </div>
      <ul className="mt-3 border-t border-primary/10 pt-3 text-sm text-ink/80">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>{i.nombre} ×{i.qty}</span>
            <span className="text-muted">{formatCOP(i.precio_cop * i.qty)}</span>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      <button type="button" onClick={() => void onEliminar()} disabled={busy} className="mt-3 text-xs text-accent hover:underline disabled:opacity-60">
        Eliminar pedido
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Página de pedidos**

`app/admin/(panel)/pedidos/page.tsx`:
```tsx
import Link from "next/link";
import { getPedidos, getItemsDePedidos } from "@/lib/admin/queries";
import { ESTADOS, ESTADO_LABEL } from "@/lib/admin/estados";
import { PedidoCard } from "@/components/admin/PedidoCard";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const pedidos = await getPedidos({ q, estado });
  const items = await getItemsDePedidos(pedidos.map((p) => p.id));
  const itemsPorPedido = (id: string) => items.filter((i) => i.pedido_id === id);

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Pedidos</h1>

      <form className="mt-6 flex flex-wrap gap-3" action="/admin/pedidos">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por referencia o nombre"
          className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
        />
        <select name="estado" defaultValue={estado ?? ""} className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-bg hover:opacity-90">Filtrar</button>
        <Link href="/admin/pedidos" className="rounded-full border border-primary/30 px-5 py-2 text-sm text-primary hover:bg-primary/10">Limpiar</Link>
      </form>

      <div className="mt-6 space-y-4">
        {pedidos.length === 0 ? (
          <p className="text-muted">No hay pedidos con esos criterios.</p>
        ) : (
          pedidos.map((p) => <PedidoCard key={p.id} pedido={p} items={itemsPorPedido(p.id)} />)
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(panel)/pedidos/page.tsx" components/admin/PedidoCard.tsx
git commit -m "feat: vista admin de pedidos (buscar/filtrar/estado/eliminar)"
```

---

### Task 12: Vista de mensajes (leído, filtrar, eliminar)

**Files:** Create `app/admin/(panel)/mensajes/page.tsx`, `components/admin/MensajeCard.tsx`.

- [ ] **Step 1: Componente de mensaje**

`components/admin/MensajeCard.tsx`:
```tsx
"use client";
import { useState } from "react";
import { marcarMensajeLeido, eliminarMensaje } from "@/lib/admin/actions";
import type { MensajeRow } from "@/lib/admin/queries";

export function MensajeCard({ mensaje }: { mensaje: MensajeRow }) {
  const [leido, setLeido] = useState(mensaje.leido);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onToggle = async () => {
    setBusy(true);
    setError(null);
    const nuevo = !leido;
    setLeido(nuevo);
    const res = await marcarMensajeLeido(mensaje.id, nuevo);
    setBusy(false);
    if (!res.ok) {
      setLeido(!nuevo);
      setError(res.error);
    }
  };

  const onEliminar = async () => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    setBusy(true);
    const res = await eliminarMensaje(mensaje.id);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className={`rounded-2xl border border-primary/10 p-5 ${leido ? "bg-surface/30" : "bg-surface/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{mensaje.asunto} {!leido && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-bg">nuevo</span>}</p>
          <p className="text-sm text-muted">{mensaje.nombre} · {mensaje.telefono}{mensaje.email ? ` · ${mensaje.email}` : ""}</p>
          <p className="mt-1 text-xs text-muted">{new Date(mensaje.created_at).toLocaleString("es-CO")}</p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap border-t border-primary/10 pt-3 text-sm text-ink/85">{mensaje.mensaje}</p>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      <div className="mt-3 flex gap-4 text-xs">
        <button type="button" onClick={() => void onToggle()} disabled={busy} className="text-primary hover:underline disabled:opacity-60">
          {leido ? "Marcar como no leído" : "Marcar como leído"}
        </button>
        <button type="button" onClick={() => void onEliminar()} disabled={busy} className="text-accent hover:underline disabled:opacity-60">
          Eliminar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Página de mensajes**

`app/admin/(panel)/mensajes/page.tsx`:
```tsx
import Link from "next/link";
import { getMensajes } from "@/lib/admin/queries";
import { MensajeCard } from "@/components/admin/MensajeCard";

export const dynamic = "force-dynamic";

export default async function AdminMensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ noleidos?: string }>;
}) {
  const { noleidos } = await searchParams;
  const soloNoLeidos = noleidos === "1";
  const mensajes = await getMensajes({ soloNoLeidos });

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Mensajes</h1>

      <div className="mt-6 flex gap-3 text-sm">
        <Link href="/admin/mensajes" className={`rounded-full border px-4 py-1.5 ${!soloNoLeidos ? "border-primary bg-primary text-bg" : "border-primary/30 text-ink/80 hover:border-primary"}`}>Todos</Link>
        <Link href="/admin/mensajes?noleidos=1" className={`rounded-full border px-4 py-1.5 ${soloNoLeidos ? "border-primary bg-primary text-bg" : "border-primary/30 text-ink/80 hover:border-primary"}`}>Sin leer</Link>
      </div>

      <div className="mt-6 space-y-4">
        {mensajes.length === 0 ? (
          <p className="text-muted">No hay mensajes.</p>
        ) : (
          mensajes.map((m) => <MensajeCard key={m.id} mensaje={m} />)
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(panel)/mensajes/page.tsx" components/admin/MensajeCard.tsx
git commit -m "feat: vista admin de mensajes (leído/filtrar/eliminar)"
```

---

### Task 13: Verificación final end-to-end

**Files:** ninguno (verificación).

- [ ] **Step 1: Suite + estáticos**

Run: `pnpm test`
Expected: PASS (incluye `estados.test.ts`).

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: los tres en verde; `/admin/login` y rutas `/admin/...` compilan; middleware presente.

- [ ] **Step 2: Verificación manual (requiere correo admin sembrado)**

Run: `pnpm dev`.
- Visitar `/admin/pedidos` sin sesión → redirige a `/admin/login`.
- Ingresar el correo admin → llega el magic link → al abrirlo, callback → `/admin`.
- En `/admin/pedidos`: se ven los pedidos; cambiar estado persiste; buscar/filtrar funciona; eliminar pide confirmación y elimina.
- En `/admin/mensajes`: marcar leído y eliminar funcionan; filtro "Sin leer" funciona.
- Iniciar sesión con un correo NO admin → no ve datos (RLS) y/o el layout redirige.
- "Cerrar sesión" vuelve al login.

- [ ] **Step 3: Advisors**

Usar MCP `get_advisors` (security y performance). Revisar y atender alertas críticas.

- [ ] **Step 4: Commit (si hubo ajustes)**

```bash
git add -A
git commit -m "chore: verificación final Fase B panel admin"
```

---

## Notas

- La autorización real vive en RLS (`is_admin()`); el middleware es la primera capa de UX.
- `/admin/login` y `/admin/auth/callback` están fuera del route group `(panel)`, por lo que NO pasan por el guard del layout (evita bucle de redirección).
- El correo admin debe sembrarse en `public.admins` (Task 3, Step 3) para poder entrar.
