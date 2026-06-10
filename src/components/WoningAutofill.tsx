"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useWoning, type WoningInfo } from "@/lib/woning";

type Status = "idle" | "looking" | "error";

export default function WoningAutofill() {
  const woning = useWoning((s) => s.woning);
  const setWoning = useWoning((s) => s.set);
  const clear = useWoning((s) => s.clear);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("looking");
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      postcode: String(form.get("postcode") ?? ""),
      huisnummer: String(form.get("huisnummer") ?? ""),
      toevoeging: String(form.get("toevoeging") ?? ""),
    };
    try {
      const res = await fetch("/api/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Niet gevonden.");
        return;
      }
      setWoning(data as WoningInfo);
      setStatus("idle");
      setOpen(false);
    } catch {
      setStatus("error");
      setError("Kon de woninggegevens niet ophalen.");
    }
  }

  const input =
    "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

  if (woning && !open) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-accent/40 bg-accent-50 p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Jouw woning</p>
          <p className="mt-0.5 truncate text-sm font-medium text-ink">{woning.weergavenaam}</p>
          <p className="mt-0.5 text-xs text-muted">
            BAG bekend — telt als bestaande woning voor de subsidiecheck.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clear();
            setOpen(true);
          }}
          className="shrink-0 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
        >
          Wijzig
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Vul je woninggegevens in</h3>
          <p className="mt-1 text-xs text-muted">
            We halen je adres uit het Kadaster (BAG) zodat je niet alles handmatig hoeft te checken.
          </p>
        </div>
        {woning && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            Annuleer
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <input name="postcode" required placeholder="1011 AB" maxLength={7} className={input} />
        <input name="huisnummer" required inputMode="numeric" placeholder="12" className={`${input} w-20`} />
        <input name="toevoeging" placeholder="A" className={`${input} w-14`} />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={status === "looking"}
          className="col-span-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
        >
          {status === "looking" ? "Zoeken…" : "Zoek mijn adres"}
        </motion.button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs text-accent-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
