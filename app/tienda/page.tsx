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
