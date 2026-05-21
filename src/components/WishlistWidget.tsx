"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatEur } from "@/lib/calculators";
import { useWishlist } from "@/lib/wishlist";

type Status = "idle" | "sending" | "done" | "error";

export default function WishlistWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const clear = useWishlist((s) => s.clear);

  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: the persisted store is only known on the client.
  if (!mounted || items.length === 0) return null;

  const total = items.reduce((s, i) => s + i.amount, 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const contact = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, items, total }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen(true);
          setStatus("idle");
        }}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8M3 14h18M3 14l1.5 5a2 2 0 0 0 2 1h11a2 2 0 0 0 2-1L21 14" />
        </svg>
        Wenslijst
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-accent">
          {items.length}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
            />
            <motion.aside
              data-testid="wishlist-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-lg font-bold text-ink">Je wenslijst</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-muted transition-colors hover:text-ink"
                  aria-label="Sluiten"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </header>

              {status === "done" ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <h3 className="text-lg font-semibold text-ink">Bedankt voor je aanvraag!</h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    We stellen één offerte samen voor alle gekozen onderdelen en
                    nemen binnen één werkdag contact met je op.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clear();
                      setOpen(false);
                    }}
                    className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Sluiten
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <ul className="space-y-3">
                      <AnimatePresence initial={false}>
                        {items.map((i) => (
                          <motion.li
                            key={i.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-start justify-between gap-3 rounded-lg border border-line p-3">
                              <div className="min-w-0">
                                <a href={i.url} className="text-sm font-semibold text-ink hover:text-accent">
                                  {i.title}
                                </a>
                                <p className="mt-0.5 text-xs text-muted">{i.summary}</p>
                                <p className="mt-1 text-sm font-medium tabular-nums text-accent">
                                  {i.amountLabel ?? formatEur(i.amount)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => remove(i.id)}
                                className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-accent-600"
                                aria-label="Verwijderen"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
                      <span className="font-semibold text-ink">Totaal indicatief</span>
                      <span className="text-lg font-bold tabular-nums text-accent">{formatEur(total)}</span>
                    </div>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-3 border-t border-line p-5">
                    <p className="text-sm font-semibold text-ink">Vraag één offerte aan voor alles</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input name="name" required placeholder="Naam" className={inputClass} />
                      <input name="email" type="email" required placeholder="E-mailadres" className={inputClass} />
                      <input name="phone" placeholder="Telefoon" className={inputClass} />
                      <input name="postcode" placeholder="Postcode" className={inputClass} />
                    </div>
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      disabled={status === "sending"}
                      className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
                    >
                      {status === "sending" ? "Versturen…" : "Vraag offerte aan"}
                    </motion.button>
                    {status === "error" && (
                      <p className="text-center text-sm text-accent-600">Er ging iets mis. Probeer het opnieuw.</p>
                    )}
                  </form>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
