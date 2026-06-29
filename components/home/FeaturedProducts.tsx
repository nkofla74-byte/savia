import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products } from "@/content/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/lib/motion/Reveal";

export function FeaturedProducts() {
  return (
    <section className="py-20 sm:py-24">
      <Reveal blur>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">Destacados</h2>
            <p className="mt-2 max-w-md text-sm text-ink/70 sm:text-base">
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

      {/* Cinta transportadora: siempre en movimiento. Se pausa al pasar el cursor. */}
      <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-bg to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-bg to-transparent sm:w-24" />
        <div className="group flex w-max items-stretch gap-4 px-2 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] sm:gap-6 sm:px-3">
          {[...products, ...products].map((p, i) => (
            <div
              key={`${p.slug}-${i}`}
              className="w-52 shrink-0 sm:w-60 lg:w-64"
              aria-hidden={i >= products.length}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
