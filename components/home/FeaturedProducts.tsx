"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products } from "@/content/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/lib/motion/Reveal";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

function Encabezado() {
  return (
    <Reveal blur>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-primary">Destacados</h2>
          <p className="mt-2 max-w-md text-ink/70">
            Los favoritos para empezar tu ritual. Elegidos por lo que aportan, no por la tendencia.
          </p>
        </div>
        <Link
          href="/tienda"
          className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
        >
          Ver toda la tienda
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </Reveal>
  );
}

export function FeaturedProducts() {
  const reduced = useReducedMotion();

  // Accesible: con prefers-reduced-motion no hay banda animada; fila con scroll nativo.
  if (reduced) {
    return (
      <section className="py-24">
        <Encabezado />
        <div className="mt-10 flex snap-x gap-6 overflow-x-auto pb-4">
          {products.map((p) => (
            <div key={p.slug} className="w-64 shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <Encabezado />
      <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent sm:w-28" />
        <div className="group flex w-max items-stretch gap-6 px-3 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
          {[...products, ...products].map((p, i) => (
            <div key={`${p.slug}-${i}`} className="w-64 shrink-0" aria-hidden={i >= products.length}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
