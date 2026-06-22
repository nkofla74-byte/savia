# Savia — Sitio web e-commerce · Diseño (Fases 0→2)

**Fecha:** 2026-06-21
**Alcance de este spec:** Fases 0, 1 y 2 (setup + sistema de diseño + catálogo + carrito + checkout por WhatsApp). Las Fases 3 (Supabase + Wompi) y 4 (SEO/legales/deploy) tendrán su propio ciclo spec → plan.
**Estado:** aprobado conceptualmente; pendiente revisión final del usuario.

---

## 1. Resumen

Savia es un e-commerce de aceites botánicos cosméticos (Bogotá, Colombia). Catálogo + carrito + checkout por WhatsApp. El sitio debe ser **hermoso, con animaciones cinematográficas elegantes** y, por decisión del usuario, ofrecer **dos identidades de marca conmutables** mediante un botón tipo dark-mode:

- **Tema "Crema"** (claro, por defecto) — la guía de marca oficial (`savia-brand-identity.html`): minimalismo de lujo.
- **Tema "Botica"** (oscuro) — la dirección dramática del plan de desarrollo (`savia-plan-claude-code.md`): botica botánica atmosférica.

Resultado de Fases 0→2: un sitio que **ya permite vender** por WhatsApp, sin depender de pasarela de pago.

---

## 2. Stack (obligatorio)

- **Next.js 15** (App Router) + **TypeScript strict** (sin `any`).
- **Tailwind CSS** + **shadcn/ui**.
- **next-themes** — gestión del conmutador de tema (SSR sin parpadeo, persistencia).
- **Animación:** **Lenis** (smooth-scroll), **Framer Motion** (reveals, micro-interacciones, transiciones de ruta), **GSAP + ScrollTrigger** (secuencias del hero, parallax).
- **Estado del carrito:** **Zustand**.
- **Formularios:** **react-hook-form** + **zod**.
- **Imágenes/SVG:** `next/image`, ilustraciones SVG inline (no fotos aún).
- **Calidad:** ESLint + Prettier. **Vitest** para lógica pura.
- **Deploy:** Vercel (en Fase 4; este spec deja el proyecto listo para `vercel`).

Server Components por defecto; `"use client"` solo en islas de animación, tema y carrito.

---

## 3. Sistema de dos temas (decisión arquitectónica central)

### 3.1 Mecanismo
- `next-themes` con `attribute="data-theme"`, valores `crema` (default) y `botica`. `disableTransitionOnChange={false}` para permitir crossfade controlado.
- Las tres fuentes se cargan **siempre** vía `next/font/google` y se exponen como CSS vars: `--font-inter`, `--font-fraunces`, `--font-hanken`.
- Cada tema mapea `--font-display` y `--font-body` a la fuente que le corresponde.
- Toda la paleta vive en CSS variables; **Tailwind** las consume vía `theme.extend.colors` (formato `rgb(var(--color-x) / <alpha-value>)`), de modo que utilidades como `bg-surface` o `text-accent` funcionan idénticas en ambos temas.
- El toggle vive en el Header (`<ThemeToggle>`), accesible (botón con `aria-label`, estado anunciado). La transición de colores se anima con una transición CSS sobre `background-color`/`color` (~400ms ease) y un sutil crossfade; respeta `prefers-reduced-motion` (cambio instantáneo).

### 3.2 Tokens — Tema "Crema" (claro, oficial, por defecto)
| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#F5F1EB` | Fondo principal (crema premium) |
| `--color-surface` | `#FFFFFF` | Tarjetas, superficies flotantes |
| `--color-primary` | `#1B5E3F` | Verde Savia — titulares, logo, acentos |
| `--color-accent` | `#C9A961` | Oro suave — solo detalles |
| `--color-ink` | `#1A1A1A` | Texto cuerpo |
| `--color-muted` | `#999999` | Texto secundario |
| `--font-display` | Inter 700 | Titulares |
| `--font-body` | Inter 400 | Cuerpo |

### 3.3 Tokens — Tema "Botica" (oscuro, dramático)
| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#1d2a20` | Fondo verde profundo |
| `--color-surface` | `#27392b` | Verde bosque — tarjetas |
| `--color-primary` | `#8fa183` | Salvia — texto/acentos suaves |
| `--color-accent` | `#cf9a3c` | Ámbar (color del aceite) — protagonista |
| `--color-accent-2` | `#e6b860` | Ámbar claro |
| `--color-ink` | `#f4efe3` | Hueso — texto sobre oscuro |
| `--color-muted` | `#8fa183` | Texto secundario |
| `--font-display` | Fraunces | Titulares (con carácter, uso medido) |
| `--font-body` | Hanken Grotesk | Cuerpo |

Escala tipográfica fluida con `clamp()`, compartida por ambos temas. Ambos temas deben cumplir contraste AA.

---

## 4. Arquitectura de animaciones (3 capas)

| Capa | Librería | Para qué | Dónde vive |
|---|---|---|---|
| Smooth-scroll global | Lenis | Scroll suave/inercial | `<LenisProvider>` cliente en `layout` |
| Reveals + micro-interacciones | Framer Motion | Aparición por scroll, hover, drawer, transición de ruta (`template.tsx`) | Primitivas `<Reveal>`, `<Stagger>` |
| Secuencias complejas | GSAP + ScrollTrigger | Hero (gota que cae y se difunde), parallax, pinned sections | Componentes cliente específicos |

**Accesibilidad (no negociable):** hook `useReducedMotion()` que desactiva Lenis (scroll nativo), pone GSAP en modo instantáneo y convierte variantes de Framer en no-op. Foco visible y navegación por teclado intactos. Tono: **cinemático elegante** (movimiento suave, lento, intencional — estilo casa de lujo, sin gritar), idéntico en ambos temas.

---

## 5. Estructura del proyecto

```
savia/
├── app/
│   ├── layout.tsx            # Fonts, <ThemeProvider>, <LenisProvider>, Header, Footer
│   ├── template.tsx          # Transición de entrada entre rutas (Framer)
│   ├── globals.css           # CSS vars de ambos temas, base, escala tipográfica
│   ├── page.tsx              # Home
│   ├── tienda/page.tsx       # Catálogo + filtro por uso
│   ├── producto/[slug]/page.tsx
│   ├── sobre/page.tsx
│   ├── contacto/page.tsx
│   └── legales/page.tsx
├── content/
│   └── products.ts           # ★ Fuente de verdad del catálogo (tipada)
├── components/
│   ├── layout/               # Header, Footer, MobileNav, ThemeToggle, Logo
│   ├── product/              # ProductCard, ProductGrid, UseFilter
│   ├── home/                 # HeroAnimation, ScienceBlock, FeaturedProducts, BrandStory, WhatsAppCTA
│   ├── cart/                 # CartDrawer, CartButton, CartLine, CheckoutForm
│   └── ui/                   # shadcn/ui generado
├── lib/
│   ├── motion/               # LenisProvider, useReducedMotion, variants, Reveal, Stagger, Parallax, MagneticButton
│   ├── cart/                 # store (Zustand) + buildWhatsAppMessage()
│   ├── theme/                # ThemeProvider wrapper (next-themes)
│   └── utils.ts              # cn(), formatCOP()
└── illustrations/            # SVGs: logo (gota-S), botánicos (lavanda, café, cacao, menta, uva)
```

**Principios de unidad:**
- `content/products.ts` — única fuente de verdad; las páginas solo leen de aquí.
- `lib/cart/buildWhatsAppMessage()` — **función pura** (items + datos cliente → texto + `wa.me` URL). Testeable sin UI.
- `lib/motion/*` — primitivas reutilizables; las páginas componen animación sin reescribir lógica.
- `Logo` — componente SVG de la gota-S (definido en la guía de marca), recolorea según tema vía `currentColor`.

---

## 6. Catálogo (datos reales)

`type Product = { slug; nombre; linea; usos: Uso[]; tamañoMl; precioCOP; descripcion; porQueFunciona; ingredientes; modoDeUso; advertencia; ilustracion; destacado; edicionEspecial? }`
`type Uso = 'cuerpo' | 'cabello' | 'rostro' | 'masaje'`

Precios reales (COP, enteros). `formatCOP()` → `$13.900`.

| Slug | Nombre · Línea | Usos | Tamaño | Precio | Nota |
|---|---|---|---|---|---|
| `calma` | Calma · Relajante (Lavanda) | cuerpo, masaje | 100 ml | 13900 | Best-seller; destacado |
| `despierta` | Despierta · Café Energizante | cuerpo, masaje | 100 ml | 13900 | Cafeína / microcirculación |
| `cacao` | Cacao · Nutritivo | cuerpo | 100 ml | 13900 | Emoliente, piel seca |
| `frescor` | Frescor · Menta Refrescante | cuerpo | 100 ml | 13900 | Ligero, absorción rápida |
| `raiz` | Raíz · Capilar Acondicionador | cabello | 100 ml | 13900 | Brillo, anti-frizz |
| `luz` | Luz · Sérum Facial | rostro | 30 ml | 21900 | Sin fragancia; premium; destacado |
| `rocio-de-rosas` | Rocío de Rosas · Tónico facial | rostro | 200 ml | 13900 | Edición especial / producto fresco |

> **Ingredientes/INCI detallados** se marcan como placeholder en el código (`// TODO confirmar INCI`) salvo pistas conocidas (Calma: almendra, coco, lavanda, vit. E; Luz: argán, semilla de uva). El usuario confirma antes de publicar. Esto NO bloquea Fases 0→2.

---

## 7. Páginas y momentos cinematográficos

- **Home:** Hero con logo/gota animada (GSAP timeline: gota cae del gotero y se difunde); bloque "con base científica" con 3-4 evidencias en *stagger*; productos destacados (Calma, Luz) con hover magnético; historia de marca breve ("Savia es el ritual diario…"); CTA WhatsApp. Parallax botánico discreto.
- **Tienda:** grilla con entrada escalonada; `UseFilter` por uso (cuerpo/cabello/rostro/masaje) con reordenamiento animado (layout animation de Framer).
- **Producto (`/producto/[slug]`):** ilustración fija (pinned) mientras el texto hace scroll; secciones "por qué funciona / ingredientes / modo de uso / advertencia" en reveal; botón "agregar al carrito" con feedback; nota de prueba de parche.
- **Sobre Savia:** narrativa de marca, tono honesto/científico.
- **Contacto:** enlace WhatsApp + formulario (react-hook-form + zod).
- **Legales:** aviso INVIMA, términos, privacidad, envíos.

---

## 8. Carrito y checkout (Fase 2 — "ya permite vender")

- **Estado:** Zustand (`items`, `add`, `remove`, `setQty`, `clear`, selector `subtotal`). No se usa localStorage para datos críticos del pedido final.
- **CartDrawer:** drawer lateral con spring suave (Framer); líneas que entran/salen animadas.
- **Checkout:** formulario (nombre, teléfono, ciudad, dirección) validado con zod → `buildWhatsAppMessage(items, customer)` arma el texto del pedido y abre `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=...`.
- El número de WhatsApp y la URL del sitio vienen de variables de entorno.

---

## 9. Copy legal (INVIMA — Colombia)

- Solo afirmaciones cosméticas: "hidrata", "suaviza", "nutre", "aroma relajante", "mejora la apariencia de…".
- **Prohibido:** "cura", "hace crecer", "trata", "elimina", "regenera", "adelgaza".
- Footer y página de legales: *"Productos cosméticos. No son medicamentos. Notificación Sanitaria Obligatoria (INVIMA) en trámite. Realice prueba de parche antes del primer uso."*
- Tono de marca: sofisticado pero accesible, científico pero sensorial, honesto, "callado" (vende por calidad, no por ruido).

---

## 10. Variables de entorno (`.env.example`)

```
NEXT_PUBLIC_WHATSAPP_NUMBER=57XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=
# Fase 3 (no se usan aún):
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# NEXT_PUBLIC_WOMPI_PUBLIC_KEY=
# WOMPI_PRIVATE_KEY=
# WOMPI_INTEGRITY_SECRET=
```

---

## 11. Testing y calidad

- **Vitest** sobre lógica pura: `buildWhatsAppMessage()` (formato del mensaje, URL-encoding, número), selectores del carrito (subtotal, qty), `formatCOP()`.
- El motion no se testea unitariamente.
- TS strict, ESLint/Prettier en verde. Accesibilidad AA en ambos temas (contraste, foco, teclado, reduced-motion).
- Mobile-first y responsive.

---

## 12. Plan de fases (resumen para el plan de implementación)

- **Fase 0 — Setup:** scaffold Next.js 15 + TS strict + Tailwind + shadcn/ui; `next-themes` y doble set de tokens; las 3 fuentes; `lib/motion` (LenisProvider, useReducedMotion, primitivas); ESLint/Prettier/Vitest; `CLAUDE.md`; `.env.example`; commit inicial.
- **Fase 1 — Contenido y catálogo:** `content/products.ts` completo; páginas (Home, Tienda, Producto, Sobre, Contacto, Legales); ilustraciones SVG; aplicación de animaciones cinematográficas en ambos temas; responsive + AA.
- **Fase 2 — Carrito + checkout WhatsApp:** store Zustand; CartDrawer; CheckoutForm; `buildWhatsAppMessage()` + tests. **Vender desde el día 1.**

**Ejecución con agentes:** tras aprobar el plan, se despliegan subagentes en paralelo para partes independientes (p. ej. sistema de diseño/tema + primitivas de motion · catálogo + páginas · carrito + checkout), respetando interfaces definidas aquí.

---

## 13. Fuera de alcance (este spec)

- Supabase / tabla `orders` (Fase 3).
- Integración Wompi, firma de integridad, webhook (Fase 3).
- SEO/OpenGraph/sitemap, página de envíos detallada, deploy (Fase 4).
- Fotos reales de producto (reemplazarán ilustraciones cuando existan).
- Three.js/WebGL para frasco 3D (posible mejora futura).
