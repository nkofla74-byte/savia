import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/content/products";
import { Botanical } from "@/illustrations/Botanical";
import { formatCOP } from "@/lib/utils";
import { QuickAddButton } from "./QuickAddButton";
import { AgregarConTamano } from "./AgregarConTamano";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-surface/50 transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl hover:shadow-primary/5">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-surface">
        {product.edicionEspecial && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-xs font-medium text-bg">
            Edición especial
          </span>
        )}
        {product.imagen ? (
          <Image
            src={product.imagen}
            alt={product.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center">
            <Botanical name={product.ilustracion} className="h-24 w-24 text-primary transition-transform duration-500 group-hover:scale-110" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/producto/${product.slug}`} className="block">
          <h3 className="font-display text-lg font-bold text-primary transition-colors group-hover:text-accent">
            {product.nombre}
          </h3>
        </Link>
        <p className="mt-0.5 text-sm text-accent">{product.linea}</p>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/70">{product.descripcion}</p>

        {product.presentaciones ? (
          <AgregarConTamano slug={product.slug} nombre={product.nombre} presentaciones={product.presentaciones} />
        ) : (
          <>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-xs text-muted">{product.tamanoMl} ml</span>
              <p className="font-display text-lg font-medium text-ink">{formatCOP(product.precioCOP)}</p>
            </div>
            <QuickAddButton slug={product.slug} nombre={product.nombre} precioCOP={product.precioCOP} />
          </>
        )}
      </div>
    </article>
  );
}
