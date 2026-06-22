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
