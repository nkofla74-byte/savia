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
