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
