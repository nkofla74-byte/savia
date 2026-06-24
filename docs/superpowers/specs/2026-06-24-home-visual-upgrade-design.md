# Spec — Upgrade visual del home (Savia)

**Fecha:** 2026-06-24
**Estado:** Aprobado para implementación
**Branch:** feat/savia-website-fases-0-2

## Objetivo

Convertir el home de Savia (hoy 100% texto, sin imagen de marca) en una landing con
fuerte primera impresión visual: un hero a pantalla completa con foto de marca,
efectos de scroll atractivos, y fotografía de apoyo en las demás secciones. Todo
respetando las convenciones del proyecto (tokens de color, copy cosmético sin claims
médicos, accesibilidad AA, mobile-first, `prefers-reduced-motion`).

## Contexto actual

- Home (`app/page.tsx`) = 5 secciones: `HeroAnimation`, `ScienceBlock`,
  `FeaturedProducts`, `BrandStory`, `WhatsAppCTA`.
- Hero actual (`components/home/HeroAnimation.tsx`): logo + línea-gota animada (GSAP) +
  título "Savia" + tagline. Centrado, sin imagen, sin CTAs.
- Motion ya disponible: **Lenis** (smooth scroll, cableado en `app/layout.tsx` /
  `lib/motion/LenisProvider.tsx`), **Framer Motion** (`Reveal`, `Stagger`), **GSAP**
  (usado en el hero; `ScrollTrigger` aún NO se usa).
- Imágenes existentes: solo fotos de producto en `public/products/`. No hay foto
  de marca/lifestyle.

## Decisiones tomadas (brainstorming)

1. **Estructura de hero:** Opción A — imagen a **pantalla completa** con título y
   botones encima.
2. **Imagen del hero:** la **aporta el usuario**. Se implementa con placeholder
   elegante + un único punto de configuración para enchufar la foto real.
3. **Efectos de scroll:** los cuatro — parallax en hero, reveals por sección,
   sección pinned (storytelling), barra de progreso.
4. **Más imágenes:** ~3–4 fotos, todas aportadas por el usuario, con placeholders y
   slots claros. Ubicaciones: hero (1), ScienceBlock (1), BrandStory pinned (1–2).
5. **Copy del hero:** aprobado (ver abajo).

## Diseño

### 1. Hero a pantalla completa (`components/home/Hero.tsx`)

Reemplaza a `HeroAnimation`. Server Component que renderiza la estructura; una isla
cliente pequeña maneja el parallax.

- **Layout:** sección `min-h-[88vh]` (o `100svh` en móvil), foto de fondo full-bleed,
  overlay degradado (`from-transparent to-black/60` vía token) para contraste AA,
  contenido alineado abajo-izquierda en desktop, centrado en móvil.
- **Imagen:** `next/image` con `fill`, `priority`, `sizes="100vw"`. Foto real
  aportada por el usuario: **campo de lavanda al atardecer** (`lavandacampo.png`,
  1584×672). Se mueve de `public/products/` a `public/hero/lavandacampo.png`.
  Constante `HERO_IMAGE = "/hero/lavandacampo.png"`. El componente conserva soporte
  de placeholder (gradiente de tokens) por si en el futuro falta el archivo.
  - **Encuadre móvil:** `object-cover` + `object-position` ajustado (~`65% center`)
    para no cortar a la persona/camino en viewport vertical.
  - **Resolución:** 1584px de ancho → nítida hasta laptop; en pantallas >1584px se
    estira levemente (aceptable para lanzar; si el usuario consigue mayor resolución,
    se sustituye el archivo sin tocar código).
  - `alt`: descripción cosmética de la escena (campo de lavanda), sin claims médicos.
- **Copy (aprobado):**
  - Eyebrow: `Aceites botánicos · Bogotá`
  - Título (`h1`, `font-display`): **Cuidado que se siente, fórmulas que se entienden**
  - Subtítulo: `Aceites botánicos con base científica. Honestos, locales, para tu ritual diario.`
- **CTAs:**
  - Primario: **Ver la tienda** → `/tienda`. Botón sólido `bg-bg text-ink` (crema
    sobre la foto oscurecida → máximo contraste).
  - Secundario: **Pedir por WhatsApp** → `wa.me/$NUMBER`. Contorno claro
    (`border` + `text-bg`).
- **Indicador de scroll:** chevron/flecha sutil centrado abajo, animación de bob;
  oculto en `reduced-motion`.
- **Accesibilidad:** un solo `h1` en la página; contraste de texto sobre imagen
  garantizado por el overlay; CTAs con foco visible y `aria-label` en WhatsApp.

### 2. Efectos de scroll

- **Parallax del hero** (`components/home/HeroParallax` o lógica dentro de una isla
  cliente): la capa de imagen se traslada a menor velocidad que el contenido usando
  `transform: translate3d`. Implementación con GSAP `ScrollTrigger` (`scrub`) **o**
  Framer `useScroll`+`useTransform` (preferir Framer por simplicidad/SSR). Movimiento
  máximo ~8–12% de la altura. **Desactivado** si `prefers-reduced-motion`.
- **Reveal por sección:** reutilizar `Reveal`/`Stagger` existentes; aplicarlos a las
  imágenes nuevas y a secciones que aún no los tengan. Sin nuevas dependencias.
- **Sección pinned (BrandStory):** convertir `BrandStory` en un momento de
  storytelling con GSAP `ScrollTrigger` `pin: true`: la cita queda fija mientras
  1–2 fotos/frases cambian con el scroll. **Fallback** en móvil (`< md`) y en
  `reduced-motion`: render estático apilado, sin pin. Encapsular `ScrollTrigger` en
  una isla cliente con cleanup (`ctx.revert()` / `ScrollTrigger.kill()`), registrando
  el plugin solo en cliente.
- **Barra de progreso** (`components/ui/ScrollProgress.tsx`): isla cliente, barra fija
  arriba (`fixed top-0 inset-x-0 h-[3px]`), color `bg-accent`, ancho = % de scroll
  (Framer `useScroll` → `scaleX`). `aria-hidden`. Respeta reduced-motion (puede
  quedarse, es informativa y no molesta; sin animación de entrada).

### 3. Fotografía de apoyo (slots aportados por el usuario)

Todas con `next/image`, lazy (sin `priority` salvo el hero), `alt` descriptivo,
bordes/encuadre con tokens. Mientras falte el archivo real, placeholder con gradiente
de tokens + label.

- **Hero:** 1 foto de fondo (`/hero/marca.jpg`).
- **ScienceBlock:** 1 foto de apoyo en columna lateral junto a los 3 puntos
  (grid 2 col en `md`: imagen + lista). Apila en móvil.
- **BrandStory (pinned):** 1–2 fotos para el storytelling.
- **FeaturedProducts:** sin cambios (ya usa fotos de producto).

Convención de carpeta: `public/hero/` y `public/secciones/` para distinguir de
`public/products/`. Nombres documentados en el spec/plan para que el usuario sepa
qué archivo subir a cada slot.

### 4. Restricciones del proyecto (CLAUDE.md)

- **Colores:** SOLO tokens (`bg-bg`, `text-ink`, `text-primary`, `bg-accent`,
  `bg-primary`…). Los hex del mockup del brainstorming NO van al código.
- **Copy:** cosmético, sin claims médicos (INVIMA).
- **TS strict**, sin `any`. Server Components por defecto; `"use client"` solo en las
  islas de motion (parallax, pinned, progreso).
- **Mobile-first** y `prefers-reduced-motion` respetado en TODO el motion nuevo.
- **Precios/format**: no aplica aquí.

## Componentes (unidades y responsabilidad)

| Componente | Tipo | Responsabilidad | Depende de |
|---|---|---|---|
| `Hero.tsx` | Server + isla | Estructura del hero, imagen, copy, CTAs | `next/image`, token CSS, isla parallax |
| `HeroParallax` (isla) | Client | Traslado parallax de la capa imagen | Framer `useScroll`/`useTransform`, `useReducedMotion` |
| `ScrollProgress.tsx` | Client | Barra de progreso superior | Framer `useScroll` |
| `BrandStory.tsx` (refactor) | Server + isla | Storytelling pinned con fallback | isla GSAP ScrollTrigger, `useReducedMotion` |
| `ScienceBlock.tsx` (edit) | Server | Añadir columna de imagen | `next/image` |
| `SectionImage.tsx` (opcional) | Server | Wrapper reutilizable imagen+placeholder | `next/image` |

## Manejo de errores / estados

- **Imagen faltante:** placeholder con gradiente de tokens (no rompe el layout, no
  404 visible). El `src` apunta a la ruta esperada; si el usuario aún no subió la foto,
  se muestra el placeholder mediante un componente que recibe `src?` opcional.
- **Sin JS / SSR:** hero, copy y CTAs renderizan estáticos; los efectos son progresivos.
- **reduced-motion:** parallax y pin desactivados → render estático equivalente.

## Testing / verificación

- `pnpm typecheck`, `pnpm lint`, `pnpm build` en verde.
- `pnpm test` (Vitest) si hay tests de componentes; añadir test ligero para
  `ScrollProgress` o el helper de reduced-motion si aporta valor (sin sobre-testear UI).
- Verificación manual: hero a pantalla completa con placeholder, CTAs navegan,
  parallax suave, barra de progreso avanza, BrandStory se fija y hace fallback en
  móvil, todo se degrada con `prefers-reduced-motion`.

## Fuera de alcance (YAGNI)

- Rediseño de páginas distintas al home.
- Nuevas dependencias (se usa GSAP/Framer/Lenis ya instalados).
- CMS/gestión de imágenes; las fotos son archivos estáticos en `public/`.
- Optimización avanzada de imágenes más allá de lo que da `next/image`.
