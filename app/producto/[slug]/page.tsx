import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/content/products";
import { Botanical } from "@/illustrations/Botanical";
import { formatCOP } from "@/lib/utils";
import { Reveal } from "@/lib/motion/Reveal";
import { AddToCart } from "@/components/cart/AddToCart";
import { AgregarConTamano } from "@/components/product/AgregarConTamano";

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
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-primary/10 bg-surface/40">
          {product.imagen ? (
            <Image src={product.imagen} alt={product.nombre} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
          ) : (
            <Botanical name={product.ilustracion} className="h-40 w-40 text-primary" />
          )}
        </div>
      </div>
      <div>
        <h1 className="font-display text-4xl font-bold text-primary">{product.nombre}</h1>
        <p className="mt-1 text-muted">
          {product.linea}{product.presentaciones ? "" : ` · ${product.tamanoMl} ml`}
        </p>
        {product.presentaciones ? (
          <>
            <p className="mt-6 text-ink/90">{product.descripcion}</p>
            <AgregarConTamano slug={product.slug} nombre={product.nombre} presentaciones={product.presentaciones} prominente />
          </>
        ) : (
          <>
            <p className="mt-4 text-2xl font-medium text-ink">{formatCOP(product.precioCOP)}</p>
            <p className="mt-6 text-ink/90">{product.descripcion}</p>
            <AddToCart slug={product.slug} nombre={product.nombre} precioCOP={product.precioCOP} />
          </>
        )}
        <Reveal className="mt-10"><h2 className="font-display text-xl text-primary">Por qué funciona</h2><p className="mt-2 text-ink/80">{product.porQueFunciona}</p></Reveal>
        <Reveal className="mt-8"><h2 className="font-display text-xl text-primary">Ingredientes</h2><ul className="mt-2 list-inside list-disc text-ink/80">{product.ingredientes.map((i) => <li key={i}>{i}</li>)}</ul></Reveal>
        <Reveal className="mt-8"><h2 className="font-display text-xl text-primary">Modo de uso</h2><p className="mt-2 text-ink/80">{product.modoDeUso}</p></Reveal>
        <p className="mt-8 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-ink/80">{product.advertencia}</p>
      </div>
    </section>
  );
}
