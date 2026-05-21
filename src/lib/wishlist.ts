import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string; // stable per distinct proposition (its shareable path+query)
  kind: "calculator" | "aanbouw";
  title: string;
  summary: string;
  amount: number; // representative richtprijs (incl. btw)
  amountLabel?: string;
  url: string; // shareable, resumable link
  measure?: string; // ISDE measure id, for isolation propositions
}

interface WishlistState {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id) ? s : { items: [...s.items, item] },
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      toggle: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id)
            ? { items: s.items.filter((i) => i.id !== item.id) }
            : { items: [...s.items, item] },
        ),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
    }),
    { name: "bw-wishlist" },
  ),
);
