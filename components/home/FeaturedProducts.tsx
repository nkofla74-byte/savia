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
