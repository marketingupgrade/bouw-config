"use client";

import { motion } from "motion/react";
import { useWishlist, type WishlistItem } from "@/lib/wishlist";

export default function AddToWishlist({
  item,
  className = "",
}: {
  item: WishlistItem;
  className?: string;
}) {
  const items = useWishlist((s) => s.items);
  const toggle = useWishlist((s) => s.toggle);
  const inList = items.some((i) => i.id === item.id);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => toggle(item)}
      aria-pressed={inList}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
        inList
          ? "border-accent bg-accent-50 text-accent"
          : "border-line text-ink-soft hover:border-ink-soft"
      } ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {inList ? <path d="M20 6 9 17l-5-5" /> : <><path d="M12 5v14" /><path d="M5 12h14" /></>}
      </svg>
      {inList ? "In wenslijst" : "Voeg toe aan wenslijst"}
    </motion.button>
  );
}
