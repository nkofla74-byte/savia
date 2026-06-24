# Home Visual Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el home de Savia en una landing con hero a pantalla completa (foto de lavanda), parallax, reveals, una sección de storytelling "pinned" y barra de progreso de scroll.

**Architecture:** Server Components para el contenido estático (SEO/LCP); islas cliente pequeñas y aisladas para el motion (parallax, progreso, storytelling), todas con Framer Motion (ya presente) y respetando `prefers-reduced-motion`. Sin nuevas dependencias. Color SOLO por tokens.

**Tech Stack:** Next.js 15 (App Router), TS strict, Tailwind v4 (tokens runtime), Framer Motion, `next/image`, Lenis (smooth scroll ya cableado).

---

## Convención de testing (importante)

El repo **no testea componentes UI** — todos los tests (`lib/`, `content/`) cubren lógica pura. Este trabajo es presentational/motion, sin lógica pura nueva testeable de forma robusta. Por tanto la verificación de cada tarea es **`pnpm typecheck` + `pnpm lint` + `pnpm build`** y una **comprobación manual** descrita. No se fuerzan tests de UI frágiles (seguimos la convención del repo). Si alguna tarea introdujera un helper puro, se le añade su test.

## Tokens disponibles (no usar hex)

`bg-bg`, `bg-surface`, `bg-primary`, `bg-accent`, `text-ink`, `text-primary`, `text-bg`, `text-muted`, `text-accent`, `border-primary`, `font-display`. Alpha con `/NN` (ej. `text-bg/85`, `from-ink/25`).

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `public/hero/lavandacampo.png` | mover desde `public/products/` | Imagen de fondo del hero |
| `components/ui/ScrollProgress.tsx` | crear | Barra de progreso fija superior (isla) |
| `components/home/HeroBackground.tsx` | crear | Imagen del hero + parallax + overlay (isla) |
| `components/home/Hero.tsx` | crear | Estructura/copy/CTAs del hero (server) |
| `components/media/SectionImage.tsx` | crear | Imagen con placeholder de tokens si falta el archivo (server) |
| `components/home/ScienceBlock.tsx` | modificar | Añadir columna de imagen |
| `components/home/BrandStory.tsx` | reescribir | Storytelling "pinned" (sticky + crossfade) con fallback (isla) |
| `components/home/HeroAnimation.tsx` | eliminar | Reemplazado por `Hero` |
| `app/page.tsx` | modificar | Montar `ScrollProgress` + `Hero` |

---

## Task 1: Mover la imagen del hero a `public/hero/`

**Files:**
- Move: `public/products/lavandacampo.png` → `public/hero/lavandacampo.png`

- [ ] **Step 1: Crear carpeta y mover el archivo**

```bash
mkdir -p public/hero
git mv public/products/lavandacampo.png public/hero/lavandacampo.png 2>/dev/null || mv public/products/lavandacampo.png public/hero/lavandacampo.png
```

- [ ] **Step 2: Verificar**

Run: `ls public/hero/lavandacampo.png`
Expected: la ruta existe.

- [ ] **Step 3: Commit**

```bash
git add public/hero/lavandacampo.png
git commit -m "chore: mueve foto de lavanda a public/hero (fondo del hero)"
```

---

## Task 2: Barra de progreso de scroll

**Files:**
- Create: `components/ui/ScrollProgress.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Crear el componente**

`components/ui/ScrollProgress.tsx`:

```tsx
"use client";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-accent"
    />
  );
}
```

- [ ] **Step 2: Montarla en el home**

En `app/page.tsx`, añadir el import y renderizarla como primer hijo:

```tsx
import { ScrollProgress } from "@/components/ui/ScrollProgress";
// ...dentro del fragment, antes del Hero:
<ScrollProgress />
```

- [ ] **Step 3: Verificar**

Run: `pnpm typecheck`
Expected: sin errores.

Manual: `pnpm dev` → al hacer scroll en el home, una línea `bg-accent` arriba crece de izquierda a derecha.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ScrollProgress.tsx app/page.tsx
git commit -m "feat: barra de progreso de scroll en el home"
```

---

## Task 3: Fondo del hero con parallax (isla)

**Files:**
- Create: `components/home/HeroBackground.tsx`

- [ ] **Step 1: Crear la isla**

`components/home/HeroBackground.tsx`:

```tsx
"use client";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

const HERO_IMAGE = "/hero/lavandacampo.png";

export function HeroBackground() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 80]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        style={reduced ? undefined : { y }}
        className="absolute -inset-y-[8%] inset-x-0"
      >
        <Image
          src={HERO_IMAGE}
          alt="Campo de lavanda al atardecer en flor"
          fill
          priority
          sizes="100vw"
          className="object-cover [object-position:65%_center]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/25 to-ink/65" />
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm typecheck`
Expected: sin errores (se usará en Task 4; aún no se monta).

- [ ] **Step 3: Commit**

```bash
git add components/home/HeroBackground.tsx
git commit -m "feat: fondo del hero con parallax (respeta reduced-motion)"
```

---

## Task 4: Hero a pantalla completa (server) + montar en home

**Files:**
- Create: `components/home/Hero.tsx`
- Modify: `app/page.tsx`
- Delete: `components/home/HeroAnimation.tsx`

- [ ] **Step 1: Crear el Hero**

`components/home/Hero.tsx` (full-bleed con la técnica `left-1/2 -translate-x-1/2 w-screen` para romper el contenedor `max-w-6xl px-5` del layout):

```tsx
import Link from "next/link";
import { HeroBackground } from "./HeroBackground";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const WA_HREF = `https://wa.me/${NUMBER}?text=${encodeURIComponent(
  "Hola Savia, quiero pedir información 🌿",
)}`;

export function Hero() {
  return (
    <section className="relative left-1/2 flex min-h-[88svh] w-screen -translate-x-1/2 items-end overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:pb-20">
        <p className="text-xs uppercase tracking-[0.18em] text-bg/85">
          Aceites botánicos · Bogotá
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-bg sm:text-5xl lg:text-6xl">
          Cuidado que se siente, fórmulas que se entienden
        </h1>
        <p className="mt-4 max-w-md text-bg/90">
          Aceites botánicos con base científica. Honestos, locales, para tu ritual diario.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/tienda"
            className="rounded-full bg-bg px-6 py-3 font-medium text-ink transition hover:opacity-90"
          >
            Ver la tienda
          </Link>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pedir por WhatsApp"
            className="rounded-full border border-bg/80 px-6 py-3 font-medium text-bg transition hover:bg-bg/10"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-bg/70 motion-safe:animate-bounce"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
```

El chevron usa `motion-safe:animate-bounce` → solo anima si el usuario no pidió `reduced-motion` (CSS puro, sin JS).

- [ ] **Step 2: Sustituir en `app/page.tsx`**

Cambiar el import `HeroAnimation` por `Hero` y usar `<Hero />` en lugar de `<HeroAnimation />`. Resultado del archivo:

```tsx
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Hero } from "@/components/home/Hero";
import { ScienceBlock } from "@/components/home/ScienceBlock";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <ScienceBlock />
      <FeaturedProducts />
      <BrandStory />
      <WhatsAppCTA />
    </>
  );
}
```

- [ ] **Step 3: Eliminar el hero viejo**

```bash
git rm components/home/HeroAnimation.tsx
```

- [ ] **Step 4: Verificar**

Run: `pnpm typecheck && pnpm build`
Expected: build verde, sin referencias a `HeroAnimation`.

Manual: `pnpm dev` → el hero ocupa el ancho completo de la ventana (sin franjas laterales), la foto de lavanda se ve de fondo con overlay, el título y los 2 botones se leen bien; "Ver la tienda" navega a `/tienda`. Sin scroll horizontal en la página.

- [ ] **Step 5: Commit**

```bash
git add components/home/Hero.tsx app/page.tsx
git commit -m "feat: hero a pantalla completa con foto, copy y CTAs"
```

---

## Task 5: Componente `SectionImage` con placeholder

**Files:**
- Create: `components/media/SectionImage.tsx`

- [ ] **Step 1: Crear el componente**

Renderiza la imagen si hay `src`; si no, un placeholder con gradiente de tokens (evita 404 mientras el usuario no sube la foto). Es `role="img"` con `aria-label` para accesibilidad.

`components/media/SectionImage.tsx`:

```tsx
import Image from "next/image";

type SectionImageProps = {
  src?: string;
  alt: string;
  sizes?: string;
  className?: string;
};

export function SectionImage({ src, alt, sizes = "(max-width: 768px) 100vw, 50vw", className }: SectionImageProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-gradient-to-br from-primary/80 to-primary/40 ${className ?? ""}`}
      >
        <span className="text-xs uppercase tracking-[0.18em] text-bg/70">Foto próximamente</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/media/SectionImage.tsx
git commit -m "feat: SectionImage con placeholder de tokens"
```

---

## Task 6: Imagen de apoyo en ScienceBlock

**Files:**
- Modify: `components/home/ScienceBlock.tsx`

- [ ] **Step 1: Reescribir ScienceBlock con columna de imagen**

Grid de 2 columnas en `md` (imagen + lista de puntos), apilado en móvil. La imagen usa `SectionImage` con `src` opcional (placeholder hasta que el usuario suba `public/secciones/ciencia.jpg`). Mantiene `Reveal`/`Stagger`.

`components/home/ScienceBlock.tsx`:

```tsx
import { Reveal } from "@/lib/motion/Reveal";
import { Stagger, StaggerItem } from "@/lib/motion/Stagger";
import { SectionImage } from "@/components/media/SectionImage";

const points = [
  { t: "Ingredientes con propósito", d: "Cada aceite se elige por lo que aporta, no por relleno." },
  { t: "Sin sobrepromesas", d: "Solo afirmaciones cosméticas honestas. Nada de milagros." },
  { t: "Hecho en Bogotá", d: "Producción local, fórmulas cuidadas, precio justo." },
];

// Cuando exista la foto, definir: const CIENCIA_IMG = "/secciones/ciencia.jpg";
const CIENCIA_IMG: string | undefined = undefined;

export function ScienceBlock() {
  return (
    <section className="py-24">
      <Reveal>
        <h2 className="font-display text-3xl font-bold text-primary">Con base científica</h2>
      </Reveal>
      <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
        <Reveal>
          <SectionImage
            src={CIENCIA_IMG}
            alt="Detalle de ingredientes botánicos de Savia"
            className="aspect-[4/3] w-full rounded-2xl"
          />
        </Reveal>
        <Stagger className="grid gap-6">
          {points.map((p) => (
            <StaggerItem key={p.t} className="rounded-2xl border border-primary/10 bg-surface/40 p-6">
              <h3 className="font-display text-lg text-primary">{p.t}</h3>
              <p className="mt-2 text-ink/80">{p.d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm typecheck`
Expected: sin errores.

Manual: `pnpm dev` → ScienceBlock muestra placeholder "Foto próximamente" a la izquierda y los 3 puntos a la derecha en desktop; apilado en móvil.

- [ ] **Step 3: Commit**

```bash
git add components/home/ScienceBlock.tsx
git commit -m "feat: imagen de apoyo en ScienceBlock (con placeholder)"
```

---

## Task 7: BrandStory "pinned" (sticky + crossfade) con fallback

**Files:**
- Modify (reescribir): `components/home/BrandStory.tsx`

**Enfoque:** en vez de GSAP ScrollTrigger (sincronización delicada con Lenis), se usa **CSS `sticky` + Framer `useScroll`** sobre una sección alta: la cita queda fija mientras dos imágenes hacen crossfade según el progreso de scroll. Es SSR-safe, funciona con Lenis sin sincronizar nada, y degrada solo. **Fallback** (`reduced-motion`): render estático apilado sin sticky ni runway.

- [ ] **Step 1: Reescribir el componente**

`components/home/BrandStory.tsx`:

```tsx
"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { SectionImage } from "@/components/media/SectionImage";

// Cuando existan las fotos, definir las rutas (ej. "/secciones/historia-1.jpg").
const SLIDE_A: string | undefined = undefined;
const SLIDE_B: string | undefined = undefined;

const QUOTE =
  "“Savia es el ritual diario que se permite quien entiende que el cuidado propio no es lujo, es inversión.”";
const SUB =
  "Savia no promete milagros. Promete mejora consistente. Cada fórmula tiene un propósito real.";

function Quote() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="font-display text-2xl leading-relaxed text-primary">{QUOTE}</p>
      <p className="mt-6 text-ink/80">{SUB}</p>
    </div>
  );
}

export function BrandStory() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bOpacity = useTransform(scrollYProgress, [0.35, 0.65], [0, 1]);

  // Fallback estático (reduced-motion): cita + imágenes apiladas, sin pin.
  if (reduced) {
    return (
      <section className="py-24">
        <Quote />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <SectionImage src={SLIDE_A} alt="El ritual Savia, paso uno" className="aspect-[4/5] w-full rounded-2xl" />
          <SectionImage src={SLIDE_B} alt="El ritual Savia, paso dos" className="aspect-[4/5] w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  // Sección alta: el contenido interno es sticky (se "fija") mientras se hace scroll.
  return (
    <section ref={ref} className="relative h-[180vh]">
      <div className="sticky top-[8vh] flex min-h-[84vh] flex-col items-center justify-center gap-10 py-10">
        <Quote />
        <div className="relative aspect-[16/9] w-full max-w-2xl">
          <SectionImage src={SLIDE_A} alt="El ritual Savia, paso uno" className="absolute inset-0 h-full w-full rounded-2xl" />
          <motion.div style={{ opacity: bOpacity }} className="absolute inset-0">
            <SectionImage src={SLIDE_B} alt="El ritual Savia, paso dos" className="h-full w-full rounded-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm typecheck && pnpm build`
Expected: build verde.

Manual: `pnpm dev` → al llegar a BrandStory, la cita+imagen quedan fijas un momento mientras la segunda imagen aparece sobre la primera (crossfade) con el scroll. En `prefers-reduced-motion` (DevTools → Rendering → Emulate `prefers-reduced-motion`), se ve la versión estática apilada sin pin.

- [ ] **Step 3: Commit**

```bash
git add components/home/BrandStory.tsx
git commit -m "feat: BrandStory pinned con crossfade (fallback reduced-motion)"
```

---

## Task 8: Verificación final

- [ ] **Step 1: Suite completa**

Run: `pnpm typecheck && pnpm lint && pnpm build && pnpm test`
Expected: todo verde (los tests existentes de `lib/`/`content/` siguen pasando).

- [ ] **Step 2: Repaso manual del home**

`pnpm dev` y verificar de arriba a abajo:
- Barra de progreso crece con el scroll.
- Hero full-bleed con foto de lavanda, copy y 2 CTAs; "Ver la tienda" → `/tienda`; sin scroll horizontal.
- Parallax sutil de la foto al hacer scroll.
- ScienceBlock con imagen (placeholder) + 3 puntos, apila en móvil.
- BrandStory se fija y hace crossfade; fallback con reduced-motion.
- Responsive a 360px de ancho sin desbordes.

- [ ] **Step 3: Commit final (si quedaron ajustes)**

```bash
git add -A
git commit -m "chore: ajustes finales del upgrade visual del home"
```

---

## Notas para el usuario (post-implementación)

Para activar las fotos de las secciones, subir los archivos y definir las constantes:
- `public/secciones/ciencia.jpg` → en `ScienceBlock.tsx`, `CIENCIA_IMG = "/secciones/ciencia.jpg"`.
- `public/secciones/historia-1.jpg` y `historia-2.jpg` → en `BrandStory.tsx`, `SLIDE_A` / `SLIDE_B`.
Mientras no existan, se muestra el placeholder "Foto próximamente" (no rompe el build).
