# Savia — Plan de desarrollo del sitio web (para Claude Code)

E-commerce de aceites botánicos cosméticos. Catálogo + carrito + checkout por WhatsApp + pago en línea (Wompi). Bogotá, Colombia.

---

## 1. Stack recomendado
- **Next.js 15** (App Router) + **TypeScript strict**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase Cloud** (Postgres + Storage para imágenes) — pedidos e inventario. Sin Docker local (Zero Local Ops).
- **Pago:** **Wompi** (Bancolombia) → PSE, Nequi, tarjeta, botón Bancolombia. Alternativa: Bold.
- **Checkout inmediato:** enlace WhatsApp (`wa.me`) — funciona desde el día 1, sin cuenta de pasarela.
- **Deploy:** Vercel (free tier).
- **Extras:** `next/image`, Vercel Analytics (opcional), `react-hook-form` + `zod` para formularios.

---

## 2. Roadmap por fases (así se lo pides a Claude Code, una fase a la vez)

**Fase 0 — Setup**
Scaffold Next.js 15 + TS strict + Tailwind + shadcn/ui. Estructura de carpetas, ESLint/Prettier, CLAUDE.md, `.env.example`. Sistema de diseño (tokens de color y tipografía).

**Fase 1 — Contenido y catálogo (sin DB)**
Productos en un archivo tipado `content/products.ts`. Páginas: Home, Tienda, Detalle de producto, Sobre Savia, Contacto, Legales. Diseño responsive y accesible. Todo el contenido real (abajo).

**Fase 2 — Carrito + checkout WhatsApp**
Carrito en estado de cliente (Zustand o Context). Drawer de carrito. Checkout que arma el pedido y abre WhatsApp con el mensaje listo. **Esto ya permite vender.**

**Fase 3 — Pedidos en Supabase + pago Wompi**
Tabla `orders`. Integración Wompi (widget o redirect), firma de integridad, webhook para confirmar transacción y actualizar estado del pedido. Página de confirmación.

**Fase 4 — Pulido y lanzamiento**
SEO (metadata, sitemap, OpenGraph), página de envíos, notas legales INVIMA, optimización de imágenes, prueba en móvil, deploy a Vercel + dominio.

---

## 3. Modelo de datos (Supabase — Fase 3)
```sql
-- orders
id uuid pk default gen_random_uuid()
created_at timestamptz default now()
customer_name text not null
customer_phone text not null
customer_city text
customer_address text
items jsonb not null          -- [{product_id, name, qty, unit_price}]
subtotal int not null         -- en COP (sin decimales)
shipping int default 0
total int not null
channel text not null         -- 'whatsapp' | 'wompi'
wompi_transaction_id text
status text default 'pending' -- pending | paid | shipped | cancelled
```
*(Productos pueden quedar en `products.ts` o migrarse a tabla `products` si quieres editarlos sin deploy.)*

---

## 4. Variables de entorno (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=57XXXXXXXXXX
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_INTEGRITY_SECRET=
NEXT_PUBLIC_SITE_URL=
```

---

# 5. PROMPT PARA CLAUDE CODE (copiar y pegar)

> Pégalo en una carpeta nueva. Pídele primero el plan; aprueba; luego que ejecute la Fase 0.

```
Eres mi desarrollador senior. Vamos a construir "Savia", una tienda online de aceites
botánicos cosméticos, para el mercado colombiano (Bogotá). Trabaja por fases, no escribas
todo de una vez: primero proponme un PLAN y un CLAUDE.md, espera mi aprobación, y luego
ejecuta la Fase 0.

== STACK (obligatorio) ==
- Next.js 15 (App Router) + TypeScript en modo strict
- Tailwind CSS + shadcn/ui
- Supabase Cloud (sin Docker local) para pedidos
- Pago: Wompi (PSE, Nequi, tarjeta). Checkout por WhatsApp como canal inmediato.
- Deploy: Vercel. Usa next/image, react-hook-form + zod.
- Accesibilidad AA, responsive mobile-first, soporta prefers-reduced-motion, foco visible.
- Nunca uses localStorage para datos críticos del pedido; el pedido final se guarda en Supabase.

== IDENTIDAD DE MARCA ==
- Nombre: Savia. Tagline: "Aceites botánicos con base científica."
- Estética: botica botánica moderna. NO genérico.
- Paleta: verde profundo #1d2a20 (fondo oscuro), verde bosque #27392b, salvia #8fa183,
  ámbar #cf9a3c (acento, color del aceite), ámbar claro #e6b860, hueso #f4efe3, tinta #16201a.
- Tipografía: display "Fraunces" (serif con carácter, uso con moderación) + cuerpo
  "Hanken Grotesk". Escala tipográfica clara.
- Motivo visual: frasco ámbar con gotero + ilustraciones botánicas (romero, lavanda, café,
  cacao, uva). Usa SVG ilustrativo, no fotos (aún no hay fotos de producto).
- Tono de copy: cálido, honesto, sin promesas médicas.

== FASES ==
Fase 0: scaffold, estructura, design tokens, CLAUDE.md, .env.example, ESLint/Prettier.
Fase 1: contenido y catálogo en content/products.ts (datos abajo). Páginas: Home, Tienda,
        Detalle de producto, Sobre Savia, Contacto, Legales. Sin base de datos todavía.
Fase 2: carrito (estado cliente) + drawer + checkout que arma el pedido y abre WhatsApp
        (https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=...). Esto ya permite vender.
Fase 3: tabla orders en Supabase + integración Wompi (widget/redirect + firma de integridad
        + webhook para confirmar pago y actualizar estado) + página de confirmación.
Fase 4: SEO/OpenGraph/sitemap, página de envíos, notas legales INVIMA, pulido y deploy.

== PÁGINAS ==
- Home: hero (frasco + sprig), bloque "con base científica" (3-4 evidencias), productos
  destacados, historia de marca breve, CTA WhatsApp.
- Tienda: grilla de productos, filtro por uso (cuerpo, cabello, rostro, masaje).
- Producto: descripción, "por qué funciona" (evidencia honesta), ingredientes/INCI, modo de
  uso, tamaño, precio, botón agregar al carrito, nota de advertencia (prueba de parche).
- Sobre Savia, Contacto (WhatsApp + formulario), Legales (aviso INVIMA, términos, privacidad, envíos).

== CATÁLOGO (contenido real; precios son PLACEHOLDER, los ajusto luego) ==
1. Calma — Relajante (cuerpo/masaje), 100 ml. Lavanda. "Aceite de masaje que suaviza la piel; aroma que relaja."
2. Despierta — Café Energizante (cuerpo/piernas), 100 ml. "Aceite vigorizante con café; antioxidante; aroma café-cítrico."
3. Cacao — Nutritivo (cuerpo), 100 ml. "Aceite muy emoliente para piel seca; aroma a cacao."
4. Frescor — Refrescante (cuerpo), 100 ml. "Aceite ligero de aroma refrescante; absorción rápida."
5. Raíz — Capilar Acondicionador (cabello), 100 ml. "Suaviza, da brillo y reduce el frizz; aroma herbal."
6. Luz — Sérum Facial (rostro), 30 ml, sin fragancia. "Aporta luminosidad y suavidad; mejora la apariencia de la elasticidad."
7. Rocío de Rosas — Tónico facial (agua de rosas). NOTA: producto fresco, refrigerado, vida corta;
   márcalo como edición especial / por pedido.

== REGLAS DE COPY (legal Colombia / INVIMA) ==
- Solo afirmaciones cosméticas: "hidrata", "suaviza", "nutre", "aroma relajante", "mejora la apariencia de…".
- PROHIBIDO: "cura", "hace crecer", "trata", "elimina", "regenera", "adelgaza".
- Incluir en footer y legales: "Productos cosméticos. No son medicamentos. Notificación
  Sanitaria Obligatoria (INVIMA) en trámite. Realice prueba de parche antes del primer uso."

== ENTREGABLES DE LA FASE 0 ==
- Estructura del proyecto y CLAUDE.md (convenciones, comandos, arquitectura).
- Design tokens (Tailwind config con la paleta y fuentes).
- .env.example con todas las variables.
- Un commit inicial limpio.

Empieza proponiendo el PLAN y el CLAUDE.md. No escribas código hasta que apruebe.
```

---

# 6. CLAUDE.md sugerido (punto de partida)

```md
# Savia — Guía del proyecto

## Qué es
Tienda online de aceites botánicos cosméticos. Mercado: Colombia (Bogotá).
Venta por catálogo + carrito, checkout por WhatsApp y pago en línea (Wompi).

## Stack
Next.js 15 (App Router), TypeScript strict, Tailwind + shadcn/ui, Supabase Cloud, Vercel.

## Comandos
- `pnpm dev` — desarrollo
- `pnpm build` — build de producción
- `pnpm lint` / `pnpm typecheck` — calidad

## Convenciones
- TypeScript strict; nada de `any`.
- Server Components por defecto; `"use client"` solo cuando haga falta.
- Precios en COP como enteros (sin decimales).
- Copy solo con afirmaciones cosméticas (ver REGLAS DE COPY). Nunca claims médicos.
- Accesibilidad AA, mobile-first, prefers-reduced-motion respetado.

## Estructura
- `content/products.ts` — catálogo tipado (fuente de verdad del producto).
- `app/` — rutas (home, tienda, producto, sobre, contacto, legales, checkout, confirmación).
- `components/` — UI reutilizable.
- `lib/` — Supabase client, Wompi, utils de carrito.

## Identidad
Paleta verde #1d2a20 + ámbar #cf9a3c. Display Fraunces, cuerpo Hanken Grotesk.
Ilustraciones botánicas en SVG (no fotos).

## Pago
- WhatsApp: arma el pedido y abre wa.me (canal inmediato).
- Wompi: widget/redirect + firma de integridad + webhook que confirma y actualiza `orders.status`.

## Legal
Footer y legales con aviso INVIMA (NSO en trámite) y recomendación de prueba de parche.
```

---

## 7. Notas prácticas
- **Wompi necesita cuenta de comercio** y verificación. Mientras tanto, la Fase 2 (WhatsApp) ya te deja vender; activa Wompi en Fase 3 cuando tengas la cuenta.
- Pídele a Claude Code **una fase por sesión** y revisa antes de avanzar — encaja con tu flujo CLAUDE.md.
- Los **precios** del catálogo quedan como placeholder hasta que cerremos el costeo.
- Cuando tengas **fotos reales** de producto, se reemplazan las ilustraciones SVG.
```
