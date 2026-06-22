import type { Product } from "@/content/products";

type Name = Product["ilustracion"];

// Minimal, elegant single-color botanical line marks (currentColor).
const paths: Record<Name, string> = {
  lavanda: "M50 90 V40 M50 40 q-8-6-6-16 M50 40 q8-6 6-16 M50 52 q-9-5-8-15 M50 52 q9-5 8-15 M50 64 q-9-4-9-13 M50 64 q9-4 9-13",
  cafe: "M50 30 c-14 0-22 12-22 26 c0 16 12 24 22 24 c10 0 22-8 22-24 c0-14-8-26-22-26 Z M50 32 v68",
  cacao: "M50 26 c-16 6-22 26-16 46 c4 12 12 18 16 20 c4-2 12-8 16-20 c6-20 0-40-16-46 Z M50 30 v60",
  menta: "M50 88 V42 M50 60 q-16 2-18-16 q16-2 18 16 M50 48 q16 2 18-16 q-16-2-18 16",
  uva: "M50 24 v10 M44 40 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M40 54 a6 6 0 1 0 12 0 M52 54 a6 6 0 1 0 12 0 M46 68 a6 6 0 1 0 12 0",
  rosa: "M50 80 V50 M50 50 c-12 0-18-8-14-18 c10-2 18 6 14 18 M50 50 c12 0 18-8 14-18 c-10-2-18 6-14 18",
};

export function Botanical({ name, className }: { name: Name; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
