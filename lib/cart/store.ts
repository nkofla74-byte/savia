import { create } from "zustand";

export type CartItem = { slug: string; nombre: string; precioCOP: number; qty: number };
type NewItem = Omit<CartItem, "qty">;

type CartState = {
  items: CartItem[];
  add: (item: NewItem) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.slug === item.slug);
      if (existing) return { items: s.items.map((i) => (i.slug === item.slug ? { ...i, qty: i.qty + 1 } : i)) };
      return { items: [...s.items, { ...item, qty: 1 }] };
    }),
  remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
  setQty: (slug, qty) =>
    set((s) => (qty <= 0 ? { items: s.items.filter((i) => i.slug !== slug) } : { items: s.items.map((i) => (i.slug === slug ? { ...i, qty } : i)) })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.precioCOP * i.qty, 0),
  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
