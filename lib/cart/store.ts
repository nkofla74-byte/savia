import { create } from "zustand";

export type CartItem = { slug: string; nombre: string; precioCOP: number; qty: number };
type NewItem = Omit<CartItem, "qty">;

type LastAdded = { nombre: string; at: number };

type CartState = {
  items: CartItem[];
  lastAdded: LastAdded | null;
  add: (item: NewItem) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  lastAdded: null,
  add: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.slug === item.slug);
      const items = existing
        ? s.items.map((i) => (i.slug === item.slug ? { ...i, qty: i.qty + 1 } : i))
        : [...s.items, { ...item, qty: 1 }];
      // `at` con timestamp para que el aviso se redispare aunque sea el mismo producto.
      return { items, lastAdded: { nombre: item.nombre, at: Date.now() } };
    }),
  remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
  setQty: (slug, qty) =>
    set((s) => (qty <= 0 ? { items: s.items.filter((i) => i.slug !== slug) } : { items: s.items.map((i) => (i.slug === slug ? { ...i, qty } : i)) })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.precioCOP * i.qty, 0),
  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
