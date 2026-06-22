# Savia Website Implementation Plan (Fases 0→2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful, animated e-commerce site for Savia (botanical cosmetic oils) that sells via WhatsApp from day one, with a switchable dual-brand theme.

**Architecture:** Next.js 15 App Router with Server Components by default. Two complete brand identities ("Crema" light / "Botica" dark) toggled via `next-themes`, driven by CSS variables consumed by Tailwind. Cinematic-but-elegant motion in three layers (Lenis smooth-scroll, Framer Motion reveals/transitions, GSAP hero sequences), always honoring `prefers-reduced-motion`. Cart state in Zustand; checkout builds a WhatsApp order message.

**Tech Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, shadcn/ui, next-themes, Lenis, Framer Motion, GSAP + ScrollTrigger, Zustand, react-hook-form + zod, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-21-savia-website-design.md`

**Package manager:** `pnpm`. Run all commands from repo root `/home/jrxdevs/savia`.

---

## File Structure

```
app/
  layout.tsx              # fonts + ThemeProvider + LenisProvider + Header + Footer
  template.tsx            # route enter transition (Framer)
  globals.css             # both themes' CSS vars, base, fluid type scale
  page.tsx                # Home
  tienda/page.tsx         # catalog + filter
  producto/[slug]/page.tsx
  sobre/page.tsx
  contacto/page.tsx
  legales/page.tsx
content/products.ts       # typed catalog (single source of truth)
components/
  layout/{Header,Footer,MobileNav,ThemeToggle,Logo}.tsx
  product/{ProductCard,ProductGrid,UseFilter}.tsx
  home/{HeroAnimation,ScienceBlock,FeaturedProducts,BrandStory,WhatsAppCTA}.tsx
  cart/{CartButton,CartDrawer,CartLine,CheckoutForm}.tsx
lib/
  motion/{LenisProvider,useReducedMotion,variants,Reveal,Stagger,Parallax,MagneticButton}.tsx
  cart/{store.ts,whatsapp.ts}
  theme/ThemeProvider.tsx
  utils.ts
illustrations/*.tsx       # Logo (drop-S) + botanical SVGs
```

---

# PHASE 0 — Setup

### Task 0.1: Scaffold Next.js 15 + TypeScript strict

**Files:** project root (generated).

- [ ] **Step 1: Scaffold the app into the current directory**

Run (from `/home/jrxdevs/savia`):
```bash
pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack --use-pnpm
```
When prompted that the directory is not empty (the spec/plan/brand files exist), choose to continue. If it refuses, scaffold in a temp dir and move files:
```bash
pnpm dlx create-next-app@latest /tmp/savia-scaffold --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack --use-pnpm \
  && cp -rn /tmp/savia-scaffold/. /home/jrxdevs/savia/ && rm -rf /tmp/savia-scaffold
```

- [ ] **Step 2: Enable TypeScript strict mode**

Edit `tsconfig.json` — ensure under `compilerOptions`:
```json
"strict": true,
"noUncheckedIndexedAccess": true
```

- [ ] **Step 3: Verify it builds and runs**

Run: `pnpm build`
Expected: build succeeds with the default starter.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js 15 + TS strict"
```

---

### Task 0.2: Install dependencies

**Files:** `package.json`.

- [ ] **Step 1: Install runtime + dev deps**

```bash
pnpm add next-themes lenis framer-motion gsap zustand react-hook-form zod @hookform/resolvers clsx tailwind-merge
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Verify install**

Run: `pnpm ls next-themes lenis framer-motion gsap zustand`
Expected: all five listed with versions.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: add project dependencies"
```

---

### Task 0.3: Vitest setup + `lib/utils.ts` with `formatCOP` (TDD)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `lib/utils.ts`, `lib/utils.test.ts`

- [ ] **Step 1: Create Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 2: Write the failing test**

`lib/utils.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatCOP } from "./utils";

describe("formatCOP", () => {
  it("formats integer COP with thousands dot and no decimals", () => {
    expect(formatCOP(13900)).toBe("$13.900");
    expect(formatCOP(21900)).toBe("$21.900");
    expect(formatCOP(0)).toBe("$0");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `formatCOP` is not exported.

- [ ] **Step 4: Implement**

`lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCOP(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-CO")}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS. If `toLocaleString` yields a different separator in CI, pin it: replace body with
`return "$" + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");`

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: utils (cn, formatCOP) + vitest setup"
```

---

### Task 0.4: Fonts + dual-theme tokens in `globals.css`

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Load the three fonts in `app/layout.tsx`**

Replace the font imports at top of `app/layout.tsx`:
```tsx
import { Inter, Fraunces, Hanken_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
```
And set the body/html class to include all three variables (full layout assembled in Task 1.4; for now):
```tsx
<html lang="es" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${hanken.variable}`}>
```

- [ ] **Step 2: Define both theme token sets in `app/globals.css`**

Replace contents of `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Tema Crema (claro, por defecto, marca oficial) */
  :root, [data-theme="crema"] {
    --color-bg: 245 241 235;       /* #F5F1EB */
    --color-surface: 255 255 255;  /* #FFFFFF */
    --color-primary: 27 94 63;     /* #1B5E3F */
    --color-accent: 201 169 97;    /* #C9A961 */
    --color-accent-2: 201 169 97;
    --color-ink: 26 26 26;         /* #1A1A1A */
    --color-muted: 153 153 153;    /* #999999 */
    --font-display: var(--font-inter);
    --font-body: var(--font-inter);
  }
  /* Tema Botica (oscuro, dramático) */
  [data-theme="botica"] {
    --color-bg: 29 42 32;          /* #1d2a20 */
    --color-surface: 39 57 43;     /* #27392b */
    --color-primary: 143 161 131;  /* #8fa183 */
    --color-accent: 207 154 60;    /* #cf9a3c */
    --color-accent-2: 230 184 96;  /* #e6b860 */
    --color-ink: 244 239 227;      /* #f4efe3 */
    --color-muted: 143 161 131;    /* #8fa183 */
    --font-display: var(--font-fraunces);
    --font-body: var(--font-hanken);
  }

  html { scroll-behavior: auto; } /* Lenis handles smooth scroll */
  body {
    background-color: rgb(var(--color-bg));
    color: rgb(var(--color-ink));
    font-family: var(--font-body), system-ui, sans-serif;
    transition: background-color 400ms ease, color 400ms ease;
  }
  h1, h2, h3, .font-display { font-family: var(--font-display), serif; }

  @media (prefers-reduced-motion: reduce) {
    body { transition: none; }
  }
}
```

- [ ] **Step 3: Wire CSS vars into Tailwind**

`tailwind.config.ts` — extend colors and fonts:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./illustrations/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-2": "rgb(var(--color-accent-2) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: dual-theme tokens + fonts + tailwind wiring"
```

---

### Task 0.5: ThemeProvider (next-themes)

**Files:**
- Create: `lib/theme/ThemeProvider.tsx`

- [ ] **Step 1: Create the provider**

`lib/theme/ThemeProvider.tsx`:
```tsx
"use client";
import { ThemeProvider as NextThemes } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes
      attribute="data-theme"
      defaultTheme="crema"
      themes={["crema", "botica"]}
      enableSystem={false}
    >
      {children}
    </NextThemes>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: next-themes ThemeProvider (crema/botica)"
```

---

### Task 0.6: Motion primitives — `useReducedMotion`, `LenisProvider`, `variants`, `Reveal`, `Stagger`

**Files:**
- Create: `lib/motion/useReducedMotion.ts`, `lib/motion/LenisProvider.tsx`, `lib/motion/variants.ts`, `lib/motion/Reveal.tsx`, `lib/motion/Stagger.tsx`

- [ ] **Step 1: `useReducedMotion` hook**

`lib/motion/useReducedMotion.ts`:
```ts
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: `LenisProvider`**

`lib/motion/LenisProvider.tsx`:
```tsx
"use client";
import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "./useReducedMotion";

export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return; // native scroll when reduced motion
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, [reduced]);
  return <>{children}</>;
}
```

- [ ] **Step 3: Shared Framer variants**

`lib/motion/variants.ts`:
```ts
import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
```

- [ ] **Step 4: `Reveal` component (no-op under reduced motion)**

`lib/motion/Reveal.tsx`:
```tsx
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "./variants";
import { useReducedMotion } from "./useReducedMotion";

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: `Stagger` container**

`lib/motion/Stagger.tsx`:
```tsx
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerParent, fadeUp } from "./variants";
import { useReducedMotion } from "./useReducedMotion";

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={fadeUp}>{children}</motion.div>;
}
```

- [ ] **Step 6: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors. (Note: `lenis` default import path is `lenis`; if types complain, use `import Lenis from "lenis";` which ships its own types.)

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: motion primitives (reduced-motion, Lenis, Reveal, Stagger)"
```

---

### Task 0.7: shadcn/ui init + base Button

**Files:** generated `components/ui/*`, `components.json`.

- [ ] **Step 1: Init shadcn**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button sheet input label
```
If prompts appear, accept defaults; base color neutral, CSS variables yes.

- [ ] **Step 2: Verify typecheck/build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: shadcn/ui init + button/sheet/input/label"
```

---

### Task 0.8: CLAUDE.md + .env.example

**Files:** Create `CLAUDE.md`, `.env.example`.

- [ ] **Step 1: `.env.example`**

```
NEXT_PUBLIC_WHATSAPP_NUMBER=57XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: `CLAUDE.md`** — paste this:
```md
# Savia — Guía del proyecto

## Qué es
Tienda online de aceites botánicos cosméticos (Bogotá). Catálogo + carrito + checkout por WhatsApp.

## Stack
Next.js 15 (App Router), TS strict, Tailwind + shadcn/ui, next-themes, Lenis/Framer/GSAP, Zustand, react-hook-form+zod, Vitest.

## Comandos
- `pnpm dev` / `pnpm build`
- `pnpm lint` / `pnpm typecheck` / `pnpm test`

## Convenciones
- TS strict; nada de `any`. Server Components por defecto; `"use client"` solo en islas (tema, motion, carrito).
- Precios COP enteros; usar `formatCOP()`.
- Copy solo cosmético (INVIMA); nunca claims médicos.
- Accesibilidad AA, mobile-first, `prefers-reduced-motion` respetado en TODO el motion.
- Dos temas: `crema` (default) y `botica`, vía `data-theme`. Colores SIEMPRE por tokens (`bg-bg`, `text-ink`, `text-primary`, `bg-accent`...), nunca hex hardcodeado.

## Estructura
content/products.ts (fuente de verdad) · app/ (rutas) · components/ · lib/ (motion, cart, theme, utils).
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: CLAUDE.md + .env.example"
```

---

# PHASE 1 — Content & catalog

### Task 1.1: `content/products.ts` (typed) + integrity test

**Files:**
- Create: `content/products.ts`, `content/products.test.ts`

- [ ] **Step 1: Write the failing test**

`content/products.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { products, getProduct, USES } from "./products";

describe("products catalog", () => {
  it("has 7 products with unique slugs", () => {
    expect(products).toHaveLength(7);
    const slugs = new Set(products.map((p) => p.slug));
    expect(slugs.size).toBe(7);
  });
  it("prices are positive integers in COP", () => {
    for (const p of products) {
      expect(Number.isInteger(p.precioCOP)).toBe(true);
      expect(p.precioCOP).toBeGreaterThan(0);
    }
  });
  it("every product use is a known use", () => {
    for (const p of products) for (const u of p.usos) expect(USES).toContain(u);
  });
  it("getProduct returns by slug or undefined", () => {
    expect(getProduct("calma")?.nombre).toBe("Calma");
    expect(getProduct("nope")).toBeUndefined();
  });
  it("has at least one featured product", () => {
    expect(products.some((p) => p.destacado)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm test content/products.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the catalog**

`content/products.ts`:
```ts
export const USES = ["cuerpo", "cabello", "rostro", "masaje"] as const;
export type Uso = (typeof USES)[number];

export type Product = {
  slug: string;
  nombre: string;
  linea: string;
  usos: Uso[];
  tamanoMl: number;
  precioCOP: number;
  descripcion: string;
  porQueFunciona: string;
  ingredientes: string[];
  modoDeUso: string;
  advertencia: string;
  ilustracion: "lavanda" | "cafe" | "cacao" | "menta" | "uva" | "rosa";
  destacado: boolean;
  edicionEspecial?: boolean;
};

const ADVERTENCIA =
  "Uso cosmético externo. Realice una prueba de parche antes del primer uso. Evite el contacto con los ojos.";

export const products: Product[] = [
  {
    slug: "calma", nombre: "Calma", linea: "Relajante · Lavanda",
    usos: ["cuerpo", "masaje"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite corporal de masaje que suaviza la piel; su aroma a lavanda ayuda a relajar.",
    porQueFunciona: "La lavanda aporta un aroma asociado a la sensación de calma; la base de aceites vegetales suaviza y nutre la piel.",
    ingredientes: ["Aceite de almendra dulce", "Aceite de coco fraccionado", "Aceite esencial de lavanda", "Vitamina E"],
    modoDeUso: "Aplica de noche, después del baño, con masajes suaves en brazos, pecho y cuello.",
    advertencia: ADVERTENCIA, ilustracion: "lavanda", destacado: true,
  },
  {
    slug: "despierta", nombre: "Despierta", linea: "Café Energizante",
    usos: ["cuerpo", "masaje"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite vigorizante con café; aroma café-cítrico, ideal para piernas.",
    porQueFunciona: "La cafeína se asocia a la sensación de ligereza; la fórmula deja la piel suave con un aroma estimulante.",
    ingredientes: ["Aceite de girasol", "Extracto de café", "Aceite esencial cítrico", "Vitamina E"],
    modoDeUso: "Masajea en piernas y zonas a tonificar, con movimientos ascendentes.",
    advertencia: ADVERTENCIA, ilustracion: "cafe", destacado: false,
  },
  {
    slug: "cacao", nombre: "Cacao", linea: "Nutritivo",
    usos: ["cuerpo"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite muy emoliente para piel seca; aroma envolvente a cacao.",
    porQueFunciona: "Los lípidos del cacao son altamente emolientes y ayudan a nutrir la piel seca.",
    ingredientes: ["Manteca/aceite de cacao", "Aceite de almendra dulce", "Vitamina E"],
    modoDeUso: "Aplica sobre piel limpia, especialmente en zonas secas.",
    advertencia: ADVERTENCIA, ilustracion: "cacao", destacado: false,
  },
  {
    slug: "frescor", nombre: "Frescor", linea: "Menta Refrescante",
    usos: ["cuerpo"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite ligero de aroma refrescante; de rápida absorción.",
    porQueFunciona: "La menta aporta una sensación refrescante; la base ligera se absorbe rápido sin sensación grasa.",
    ingredientes: ["Aceite de girasol", "Aceite esencial de menta", "Vitamina E"],
    modoDeUso: "Aplica en cuerpo tras el baño para una sensación fresca.",
    advertencia: ADVERTENCIA, ilustracion: "menta", destacado: false,
  },
  {
    slug: "raiz", nombre: "Raíz", linea: "Capilar Acondicionador",
    usos: ["cabello"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Suaviza, da brillo y reduce el frizz; aroma herbal.",
    porQueFunciona: "Los aceites vegetales ayudan a sellar la cutícula del cabello, aportando brillo y suavidad.",
    ingredientes: ["Aceite de coco", "Aceite de argán", "Aceite esencial herbal"],
    modoDeUso: "Aplica una pequeña cantidad en puntas y medios; no enjuagar.",
    advertencia: ADVERTENCIA, ilustracion: "uva", destacado: false,
  },
  {
    slug: "luz", nombre: "Luz", linea: "Sérum Facial",
    usos: ["rostro"], tamanoMl: 30, precioCOP: 21900,
    descripcion: "Aporta luminosidad y suavidad; mejora la apariencia de la elasticidad. Sin fragancia.",
    porQueFunciona: "El argán y la semilla de uva ayudan a mejorar la apariencia de la piel y a reforzar su sensación de suavidad.",
    ingredientes: ["Aceite de argán", "Aceite de semilla de uva", "Vitamina E"],
    modoDeUso: "Aplica unas gotas en el rostro por la noche, sobre piel limpia.",
    advertencia: ADVERTENCIA, ilustracion: "uva", destacado: true,
  },
  {
    slug: "rocio-de-rosas", nombre: "Rocío de Rosas", linea: "Tónico facial",
    usos: ["rostro"], tamanoMl: 200, precioCOP: 13900,
    descripcion: "Tónico facial de agua de rosas; producto fresco, edición especial por pedido.",
    porQueFunciona: "El agua de rosas aporta una sensación refrescante y de confort a la piel del rostro.",
    ingredientes: ["Agua de rosas", "Conservante cosmético apto"],
    modoDeUso: "Aplica con algodón sobre el rostro limpio. Mantener refrigerado.",
    advertencia: ADVERTENCIA + " Producto fresco de vida útil corta; conservar en frío.",
    ilustracion: "rosa", destacado: false, edicionEspecial: true,
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test content/products.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: typed product catalog + integrity tests"
```

---

### Task 1.2: Logo + botanical SVG illustrations

**Files:**
- Create: `illustrations/Logo.tsx`, `illustrations/Botanical.tsx`

- [ ] **Step 1: Logo (drop-S, recolors via currentColor)**

`illustrations/Logo.tsx`:
```tsx
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Savia">
      <path d="M60 20 C 50 35, 40 50, 40 65 C 40 85, 48 100, 60 100 C 72 100, 80 85, 80 65 C 80 50, 70 35, 60 20 Z" fill="currentColor" />
      <path d="M 58 35 Q 62 45, 58 60" stroke="rgb(var(--color-bg))" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="50" r="3" fill="rgb(var(--color-bg))" opacity="0.7" />
    </svg>
  );
}
```

- [ ] **Step 2: Botanical illustrations keyed by name**

`illustrations/Botanical.tsx`:
```tsx
import type { Product } from "@/content/products";

type Name = Product["ilustracion"];

// Minimal, elegant single-color botanical line marks (currentColor).
const paths: Record<Name, string> = {
  lavanda: "M50 90 V40 M50 40 q-8-6-6-16 M50 40 q8-6 6-16 M50 52 q-9-5-8-15 M50 52 q9-5 8-15 M50 64 q-9-4-9-13 M50 64 q9-4 9-13",
  cafe: "M50 30 c-14 0-22 12-22 26 c0 16 12 24 22 24 c10 0 22-8 22-24 c0-14-8-26-22-26 Z M50 32 v68",
  cacao: "M50 26 c-16 6-22 26-16 46 c4 12 12 18 16 20 c4-2 12-8 16-20 c6-20 0-40-16-46 Z M50 30 v60",
  menta: "M50 88 V42 M50 60 q-16 2-18-16 q16-2 18 16 M50 48 q16 2 18-16 q-16-2-18 16",
  uva: "M50 24 v10 M44 40 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M40 54 a6 6 0 1 0 12 0 M52 54 a6 6 0 1 0 12 0 M46 68 a6 6 0 1 0 12 0",
  rosa: "M50 80 V50 M50 50 c-12 0-18-8-14-18 c10-2 18 6 14 18 M50 50 c12 0 18-8 14-18 c-10-2-18 6-14 18",
};

export function Botanical({ name, className }: { name: Name; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: logo + botanical SVG illustrations"
```

---

### Task 1.3: ThemeToggle

**Files:** Create `components/layout/ThemeToggle.tsx`.

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" aria-hidden />;
  const isBotica = theme === "botica";
  return (
    <button
      type="button"
      onClick={() => setTheme(isBotica ? "crema" : "botica")}
      aria-label={isBotica ? "Cambiar a tema Crema (claro)" : "Cambiar a tema Botica (oscuro)"}
      className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 text-primary transition-colors hover:bg-primary/10"
    >
      <span className="text-sm">{isBotica ? "☾" : "☀"}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: theme toggle (crema/botica)"
```

---

### Task 1.4: Layout assembly — Header, Footer, providers, route template

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/Footer.tsx`
- Modify: `app/layout.tsx`
- Create: `app/template.tsx`

- [ ] **Step 1: Header**

`components/layout/Header.tsx`:
```tsx
import Link from "next/link";
import { Logo } from "@/illustrations/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "@/components/cart/CartButton";

const nav = [
  { href: "/tienda", label: "Tienda" },
  { href: "/sobre", label: "Sobre Savia" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-wide">Savia</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-ink/80 transition-colors hover:text-primary">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Footer (with INVIMA legal notice)**

`components/layout/Footer.tsx`:
```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-primary/10 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-muted">
        <div className="flex flex-wrap gap-6">
          <Link href="/legales" className="hover:text-primary">Legales</Link>
          <Link href="/sobre" className="hover:text-primary">Sobre Savia</Link>
          <Link href="/contacto" className="hover:text-primary">Contacto</Link>
        </div>
        <p className="mt-6 max-w-2xl">
          Productos cosméticos. No son medicamentos. Notificación Sanitaria Obligatoria (INVIMA) en trámite.
          Realice prueba de parche antes del primer uso.
        </p>
        <p className="mt-4">© {new Date().getFullYear()} Savia · Bogotá, Colombia</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Assemble `app/layout.tsx`**

Full file:
```tsx
import type { Metadata } from "next";
import { Inter, Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  title: "Savia — Aceites botánicos",
  description: "Aceites botánicos cosméticos con base científica. Bogotá. Fórmulas honestas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${hanken.variable}`}>
      <body>
        <ThemeProvider>
          <LenisProvider>
            <Header />
            <main className="mx-auto max-w-6xl px-5">{children}</main>
            <Footer />
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Route enter transition `app/template.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Verify build (CartButton stub may not exist yet)**

Create a temporary stub so the layout builds before Phase 2: `components/cart/CartButton.tsx`:
```tsx
"use client";
export function CartButton() {
  return <button type="button" aria-label="Carrito" className="text-sm text-primary">Carrito</button>;
}
```
Run: `pnpm build`
Expected: build succeeds. (CartButton is replaced in Task 2.3.)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: layout (header/footer/providers) + route transition"
```

---

### Task 1.5: ProductCard + ProductGrid + UseFilter + Tienda page

**Files:**
- Create: `components/product/ProductCard.tsx`, `components/product/ProductGrid.tsx`, `components/product/UseFilter.tsx`, `app/tienda/page.tsx`

- [ ] **Step 1: ProductCard**

`components/product/ProductCard.tsx`:
```tsx
import Link from "next/link";
import type { Product } from "@/content/products";
import { Botanical } from "@/illustrations/Botanical";
import { formatCOP } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/producto/${product.slug}`} className="group block rounded-2xl border border-primary/10 bg-surface/50 p-6 transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-4 grid place-items-center">
        <Botanical name={product.ilustracion} className="h-24 w-24 text-primary transition-transform duration-500 group-hover:scale-110" />
      </div>
      <h3 className="font-display text-lg font-bold text-primary">{product.nombre}</h3>
      <p className="text-sm text-muted">{product.linea} · {product.tamanoMl} ml</p>
      <p className="mt-3 font-medium text-ink">{formatCOP(product.precioCOP)}</p>
    </Link>
  );
}
```

- [ ] **Step 2: ProductGrid (Framer layout animation)**

`components/product/ProductGrid.tsx`:
```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/content/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {products.map((p) => (
          <motion.div key={p.slug} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: UseFilter**

`components/product/UseFilter.tsx`:
```tsx
"use client";
import { USES, type Uso } from "@/content/products";

export function UseFilter({ active, onChange }: { active: Uso | "todos"; onChange: (u: Uso | "todos") => void }) {
  const options: (Uso | "todos")[] = ["todos", ...USES];
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${active === o ? "border-primary bg-primary text-bg" : "border-primary/30 text-ink/80 hover:border-primary"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Tienda page (client wrapper for filter state)**

`app/tienda/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { products, type Uso } from "@/content/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { UseFilter } from "@/components/product/UseFilter";

export default function TiendaPage() {
  const [active, setActive] = useState<Uso | "todos">("todos");
  const shown = active === "todos" ? products : products.filter((p) => p.usos.includes(active));
  return (
    <section className="py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Tienda</h1>
      <p className="mb-8 mt-2 text-muted">Aceites botánicos. Fórmulas honestas.</p>
      <UseFilter active={active} onChange={setActive} />
      <ProductGrid products={shown} />
    </section>
  );
}
```

- [ ] **Step 5: Verify build + manual check**

Run: `pnpm build && pnpm dev` then open `http://localhost:3000/tienda`.
Expected: grid of 7 cards; clicking filter chips reanimates the grid; theme toggle in header switches palettes and fonts.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: tienda page (card/grid/filter)"
```

---

### Task 1.6: Producto detail page

**Files:** Create `app/producto/[slug]/page.tsx`.

- [ ] **Step 1: Implement (Server Component + static params)**

```tsx
import { notFound } from "next/navigation";
import { getProduct, products } from "@/content/products";
import { Botanical } from "@/illustrations/Botanical";
import { formatCOP } from "@/lib/utils";
import { Reveal } from "@/lib/motion/Reveal";
import { AddToCart } from "@/components/cart/AddToCart";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return (
    <section className="grid gap-12 py-16 md:grid-cols-2">
      <div className="md:sticky md:top-28 md:self-start">
        <div className="grid aspect-square place-items-center rounded-3xl border border-primary/10 bg-surface/40">
          <Botanical name={product.ilustracion} className="h-40 w-40 text-primary" />
        </div>
      </div>
      <div>
        <h1 className="font-display text-4xl font-bold text-primary">{product.nombre}</h1>
        <p className="mt-1 text-muted">{product.linea} · {product.tamanoMl} ml</p>
        <p className="mt-4 text-2xl font-medium text-ink">{formatCOP(product.precioCOP)}</p>
        <p className="mt-6 text-ink/90">{product.descripcion}</p>
        <AddToCart slug={product.slug} nombre={product.nombre} precioCOP={product.precioCOP} />
        <Reveal className="mt-10"><h2 className="font-display text-xl text-primary">Por qué funciona</h2><p className="mt-2 text-ink/80">{product.porQueFunciona}</p></Reveal>
        <Reveal className="mt-8"><h2 className="font-display text-xl text-primary">Ingredientes</h2><ul className="mt-2 list-inside list-disc text-ink/80">{product.ingredientes.map((i) => <li key={i}>{i}</li>)}</ul></Reveal>
        <Reveal className="mt-8"><h2 className="font-display text-xl text-primary">Modo de uso</h2><p className="mt-2 text-ink/80">{product.modoDeUso}</p></Reveal>
        <p className="mt-8 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-ink/80">{product.advertencia}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: 7 static product pages generated. (`AddToCart` is created in Task 2.3; create a stub now if building before Phase 2: `components/cart/AddToCart.tsx` exporting `export function AddToCart(_: {slug:string;nombre:string;precioCOP:number}) { return null; }`.)

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: product detail page"
```

---

### Task 1.7: Home page sections

**Files:**
- Create: `components/home/HeroAnimation.tsx`, `components/home/ScienceBlock.tsx`, `components/home/FeaturedProducts.tsx`, `components/home/BrandStory.tsx`, `components/home/WhatsAppCTA.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: HeroAnimation (GSAP drop, reduced-motion safe)**

`components/home/HeroAnimation.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Logo } from "@/illustrations/Logo";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function HeroAnimation() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-logo", { y: -30, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.from(".hero-line", { y: 24, opacity: 0, duration: 0.9, stagger: 0.15, delay: 0.2, ease: "power3.out" });
      gsap.fromTo(".hero-drop", { scaleY: 0, transformOrigin: "top center", opacity: 0.6 }, { scaleY: 1, opacity: 1, duration: 1.2, delay: 0.5, ease: "power2.inOut" });
    }, root);
    return () => ctx.revert();
  }, [reduced]);
  return (
    <div ref={root} className="grid min-h-[72vh] place-items-center text-center">
      <div>
        <Logo className="hero-logo mx-auto h-20 w-20 text-primary" />
        <div className="hero-drop mx-auto my-4 h-16 w-px bg-accent" />
        <h1 className="hero-line font-display text-5xl font-bold text-primary sm:text-6xl">Savia</h1>
        <p className="hero-line mx-auto mt-4 max-w-md text-lg text-ink/80">Aceites botánicos con base científica. Fórmulas honestas, hechas en Bogotá.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ScienceBlock**

`components/home/ScienceBlock.tsx`:
```tsx
import { Reveal } from "@/lib/motion/Reveal";
import { Stagger, StaggerItem } from "@/lib/motion/Stagger";

const points = [
  { t: "Ingredientes con propósito", d: "Cada aceite se elige por lo que aporta, no por relleno." },
  { t: "Sin sobrepromesas", d: "Solo afirmaciones cosméticas honestas. Nada de milagros." },
  { t: "Hecho en Bogotá", d: "Producción local, fórmulas cuidadas, precio justo." },
];

export function ScienceBlock() {
  return (
    <section className="py-24">
      <Reveal><h2 className="font-display text-3xl font-bold text-primary">Con base científica</h2></Reveal>
      <Stagger className="mt-10 grid gap-8 md:grid-cols-3">
        {points.map((p) => (
          <StaggerItem key={p.t} className="rounded-2xl border border-primary/10 bg-surface/40 p-6">
            <h3 className="font-display text-lg text-primary">{p.t}</h3>
            <p className="mt-2 text-ink/80">{p.d}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
```

- [ ] **Step 3: FeaturedProducts**

`components/home/FeaturedProducts.tsx`:
```tsx
import { products } from "@/content/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/lib/motion/Reveal";

export function FeaturedProducts() {
  const featured = products.filter((p) => p.destacado);
  return (
    <section className="py-24">
      <Reveal><h2 className="font-display text-3xl font-bold text-primary">Destacados</h2></Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: BrandStory + WhatsAppCTA**

`components/home/BrandStory.tsx`:
```tsx
import { Reveal } from "@/lib/motion/Reveal";

export function BrandStory() {
  return (
    <section className="py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-display text-2xl leading-relaxed text-primary">
          “Savia es el ritual diario que se permite quien entiende que el cuidado propio no es lujo, es inversión.”
        </p>
        <p className="mt-6 text-ink/80">Savia no promete milagros. Promete mejora consistente. Cada fórmula tiene un propósito real.</p>
      </Reveal>
    </section>
  );
}
```

`components/home/WhatsAppCTA.tsx`:
```tsx
const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function WhatsAppCTA() {
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia, quiero pedir información 🌿")}`;
  return (
    <section className="py-24 text-center">
      <h2 className="font-display text-3xl font-bold text-primary">¿Lista para probar Savia?</h2>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-bg transition-opacity hover:opacity-90">
        Escríbenos por WhatsApp
      </a>
    </section>
  );
}
```

- [ ] **Step 5: Assemble `app/page.tsx`**

```tsx
import { HeroAnimation } from "@/components/home/HeroAnimation";
import { ScienceBlock } from "@/components/home/ScienceBlock";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";

export default function HomePage() {
  return (
    <>
      <HeroAnimation />
      <ScienceBlock />
      <FeaturedProducts />
      <BrandStory />
      <WhatsAppCTA />
    </>
  );
}
```

- [ ] **Step 6: Verify build + manual check**

Run: `pnpm build && pnpm dev` → open `/`.
Expected: hero animates in; sections reveal on scroll; reduced-motion (OS setting) disables motion; theme toggle swaps both palettes.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: home page sections"
```

---

### Task 1.8: Sobre, Contacto, Legales pages

**Files:** Create `app/sobre/page.tsx`, `app/contacto/page.tsx`, `app/legales/page.tsx`.

- [ ] **Step 1: Sobre**

```tsx
import { Reveal } from "@/lib/motion/Reveal";
export default function SobrePage() {
  return (
    <section className="prose-invert max-w-2xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Sobre Savia</h1>
      <Reveal className="mt-6 space-y-4 text-ink/85">
        <p>Savia nació del cansancio de los aceites que prometen todo y no hacen nada. Empezamos a formular con ingredientes que de verdad aportan, con respaldo, y a un precio justo.</p>
        <p>Sofisticada pero accesible. Científica pero sensorial. Bogotana con mirada global. Vendemos por calidad, no por ruido.</p>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Contacto**

```tsx
const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
export default function ContactoPage() {
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia 🌿")}`;
  return (
    <section className="max-w-xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Contacto</h1>
      <p className="mt-4 text-ink/80">La forma más rápida de hablar con nosotros es por WhatsApp.</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-bg hover:opacity-90">Abrir WhatsApp</a>
    </section>
  );
}
```

- [ ] **Step 3: Legales**

```tsx
export default function LegalesPage() {
  return (
    <section className="prose-invert max-w-2xl py-16 text-ink/85">
      <h1 className="font-display text-4xl font-bold text-primary">Legales</h1>
      <h2 className="mt-8 font-display text-xl text-primary">Aviso cosmético (INVIMA)</h2>
      <p className="mt-2">Productos cosméticos. No son medicamentos. Notificación Sanitaria Obligatoria (INVIMA) en trámite. Realice una prueba de parche antes del primer uso.</p>
      <h2 className="mt-8 font-display text-xl text-primary">Envíos</h2>
      <p className="mt-2">Realizamos entregas en Bogotá y envíos a nivel nacional. Coordinamos por WhatsApp al confirmar tu pedido.</p>
      <h2 className="mt-8 font-display text-xl text-primary">Privacidad</h2>
      <p className="mt-2">Usamos tus datos solo para gestionar tu pedido y contacto. No los compartimos con terceros.</p>
    </section>
  );
}
```

- [ ] **Step 4: Verify build + commit**

Run: `pnpm build`
Expected: succeeds.
```bash
git add -A && git commit -m "feat: sobre/contacto/legales pages"
```

---

# PHASE 2 — Cart & WhatsApp checkout

### Task 2.1: Cart store (Zustand) + tests (TDD)

**Files:** Create `lib/cart/store.ts`, `lib/cart/store.test.ts`.

- [ ] **Step 1: Write the failing test**

`lib/cart/store.test.ts`:
```ts
import { describe, expect, it, beforeEach } from "vitest";
import { useCart } from "./store";

const reset = () => useCart.setState({ items: [] });

describe("cart store", () => {
  beforeEach(reset);
  it("adds an item and increments qty on re-add", () => {
    useCart.getState().add({ slug: "calma", nombre: "Calma", precioCOP: 13900 });
    useCart.getState().add({ slug: "calma", nombre: "Calma", precioCOP: 13900 });
    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.qty).toBe(2);
  });
  it("setQty removes when qty <= 0", () => {
    useCart.getState().add({ slug: "luz", nombre: "Luz", precioCOP: 21900 });
    useCart.getState().setQty("luz", 0);
    expect(useCart.getState().items).toHaveLength(0);
  });
  it("subtotal sums qty * price", () => {
    useCart.getState().add({ slug: "calma", nombre: "Calma", precioCOP: 13900 });
    useCart.getState().add({ slug: "luz", nombre: "Luz", precioCOP: 21900 });
    useCart.getState().setQty("calma", 2);
    expect(useCart.getState().subtotal()).toBe(2 * 13900 + 21900);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm test lib/cart/store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/cart/store.ts`:
```ts
import { create } from "zustand";

export type CartItem = { slug: string; nombre: string; precioCOP: number; qty: number };
type NewItem = Omit<CartItem, "qty">;

type CartState = {
  items: CartItem[];
  add: (item: NewItem) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.slug === item.slug);
      if (existing) return { items: s.items.map((i) => (i.slug === item.slug ? { ...i, qty: i.qty + 1 } : i)) };
      return { items: [...s.items, { ...item, qty: 1 }] };
    }),
  remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
  setQty: (slug, qty) =>
    set((s) => (qty <= 0 ? { items: s.items.filter((i) => i.slug !== slug) } : { items: s.items.map((i) => (i.slug === slug ? { ...i, qty } : i)) })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.precioCOP * i.qty, 0),
  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test lib/cart/store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: cart store (zustand) + tests"
```

---

### Task 2.2: `buildWhatsAppMessage` pure function + tests (TDD)

**Files:** Create `lib/cart/whatsapp.ts`, `lib/cart/whatsapp.test.ts`.

- [ ] **Step 1: Write the failing test**

`lib/cart/whatsapp.test.ts`:
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
  it("includes each item, qty, customer and subtotal", () => {
    const { text } = buildWhatsAppMessage(items, customer, "573001112233");
    expect(text).toContain("Calma x2");
    expect(text).toContain("Luz x1");
    expect(text).toContain("Ana");
    expect(text).toContain("Bogotá");
    expect(text).toContain("$49.700"); // 2*13900 + 21900
  });
  it("builds a wa.me url with encoded text and the given number", () => {
    const { url } = buildWhatsAppMessage(items, customer, "573001112233");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Calma x2"));
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm test lib/cart/whatsapp.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/cart/whatsapp.ts`:
```ts
import type { CartItem } from "./store";
import { formatCOP } from "@/lib/utils";

export type Customer = { nombre: string; telefono: string; ciudad: string; direccion: string };

export function buildWhatsAppMessage(items: CartItem[], customer: Customer, whatsappNumber: string) {
  const subtotal = items.reduce((s, i) => s + i.precioCOP * i.qty, 0);
  const lines = [
    "Hola Savia 🌿, quiero hacer un pedido:",
    "",
    ...items.map((i) => `• ${i.nombre} x${i.qty} — ${formatCOP(i.precioCOP * i.qty)}`),
    "",
    `Subtotal: ${formatCOP(subtotal)}`,
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

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test lib/cart/whatsapp.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: buildWhatsAppMessage + tests"
```

---

### Task 2.3: CartButton, AddToCart, CartLine, CartDrawer

**Files:**
- Replace: `components/cart/CartButton.tsx`, `components/cart/AddToCart.tsx`
- Create: `components/cart/CartLine.tsx`, `components/cart/CartDrawer.tsx`

- [ ] **Step 1: AddToCart**

`components/cart/AddToCart.tsx`:
```tsx
"use client";
import { useCart } from "@/lib/cart/store";

export function AddToCart({ slug, nombre, precioCOP }: { slug: string; nombre: string; precioCOP: number }) {
  const add = useCart((s) => s.add);
  return (
    <button type="button" onClick={() => add({ slug, nombre, precioCOP })}
      className="mt-6 rounded-full bg-primary px-8 py-3 font-medium text-bg transition-transform active:scale-95 hover:opacity-90">
      Agregar al carrito
    </button>
  );
}
```

- [ ] **Step 2: CartButton (with live count, opens drawer)**

`components/cart/CartButton.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart/store";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Carrito (${count})`} className="relative text-sm text-primary">
        Carrito
        {count > 0 && <span className="absolute -right-3 -top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-xs text-bg">{count}</span>}
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
```

- [ ] **Step 3: CartLine**

`components/cart/CartLine.tsx`:
```tsx
"use client";
import { motion } from "framer-motion";
import type { CartItem } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/store";
import { formatCOP } from "@/lib/utils";

export function CartLine({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  return (
    <motion.div layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="flex items-center justify-between border-b border-primary/10 py-3">
      <div>
        <p className="text-ink">{item.nombre}</p>
        <p className="text-sm text-muted">{formatCOP(item.precioCOP)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Quitar uno" onClick={() => setQty(item.slug, item.qty - 1)} className="h-7 w-7 rounded-full border border-primary/30">−</button>
        <span className="w-6 text-center">{item.qty}</span>
        <button type="button" aria-label="Agregar uno" onClick={() => setQty(item.slug, item.qty + 1)} className="h-7 w-7 rounded-full border border-primary/30">+</button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: CartDrawer (uses shadcn Sheet; hosts CheckoutForm from Task 2.4)**

`components/cart/CartDrawer.tsx`:
```tsx
"use client";
import { AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/store";
import { formatCOP } from "@/lib/utils";
import { CartLine } from "./CartLine";
import { CheckoutForm } from "./CheckoutForm";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col bg-bg text-ink sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-primary">Tu pedido</SheetTitle></SheetHeader>
        {items.length === 0 ? (
          <p className="mt-8 text-muted">Tu carrito está vacío.</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto"><AnimatePresence initial={false}>{items.map((i) => <CartLine key={i.slug} item={i} />)}</AnimatePresence></div>
            <div className="border-t border-primary/10 pt-4">
              <div className="mb-4 flex justify-between font-medium"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
              <CheckoutForm />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Verify typecheck (CheckoutForm created next)**

Defer build verification to Task 2.4 Step 4 (CheckoutForm must exist first).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: cart UI (button, add, line, drawer)"
```

---

### Task 2.4: CheckoutForm → WhatsApp

**Files:** Create `components/cart/CheckoutForm.tsx`.

- [ ] **Step 1: Implement (rhf + zod → buildWhatsAppMessage)**

`components/cart/CheckoutForm.tsx`:
```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart/store";
import { buildWhatsAppMessage } from "@/lib/cart/whatsapp";

const schema = z.object({
  nombre: z.string().min(2, "Tu nombre"),
  telefono: z.string().min(7, "Teléfono válido"),
  ciudad: z.string().min(2, "Ciudad"),
  direccion: z.string().min(4, "Dirección"),
});
type FormValues = z.infer<typeof schema>;

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    const { url } = buildWhatsAppMessage(items, data, NUMBER);
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
        Pedir por WhatsApp
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS (utils, products, cart store, whatsapp).

- [ ] **Step 3: Typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual end-to-end check**

Run: `pnpm dev`. Add products, open cart, fill form, submit → a new tab opens to `wa.me/<number>` with the prefilled order message. Verify reduced-motion (OS) disables animations and the theme toggle swaps both palettes/fonts everywhere.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: checkout form → WhatsApp order"
```

---

## Final verification (end of Fase 2)

- [ ] `pnpm lint` — clean
- [ ] `pnpm typecheck` — clean
- [ ] `pnpm test` — all green
- [ ] `pnpm build` — succeeds; home + tienda + 7 product pages + sobre/contacto/legales render
- [ ] Manual: theme toggle (crema⇄botica) works site-wide; cart→WhatsApp flow works; `prefers-reduced-motion` honored

---

## Spec coverage check

- Dual-theme system → Tasks 0.4, 0.5, 1.3 ✅
- Motion 3-layer + reduced-motion → Tasks 0.6, 1.5 (grid), 1.7 (GSAP hero) ✅
- Catalog real data → Task 1.1 ✅
- All pages (home/tienda/producto/sobre/contacto/legales) → Tasks 1.5–1.8 ✅
- Cart + checkout WhatsApp → Tasks 2.1–2.4 ✅
- INVIMA copy → Footer (1.4) + Legales (1.8) + product advertencia (1.1) ✅
- Testing pure logic → Tasks 0.3, 1.1, 2.1, 2.2 ✅
- Out of scope (Supabase/Wompi/SEO/deploy) → not included, per spec ✅
