import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products } from "@/content/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/lib/motion/Reveal";
import { Stagger, StaggerItem } from "@/lib/motion/Stagger";

export function FeaturedProducts() {
  const featured = products.filter((p) => p.destacado);
  return (
    <section className="py-24">
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
      <Stagger className="mt-10 grid gap-6 sm:grid-cols-2">
        {featured.map((p) => (
          <StaggerItem key={p.slug}>
            <ProductCard product={p} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
