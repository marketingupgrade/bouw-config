"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Calculator, Values } from "@/lib/calculators";

type Status = "idle" | "busy" | "error";

function downscale(file: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no 2d context"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MockupPanel({ calc, values }: { calc: Calculator; values: Values }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!calc.mockup) return null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError("");
    try {
      setPhoto(await downscale(file));
    } catch {
      setError("Kon de foto niet inladen.");
    }
  }

  async function generate() {
    if (!photo || !calc.mockup) return;
    setStatus("busy");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, spec: calc.mockup.buildPrompt(values), mode: "edit" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Er ging iets mis.");
        return;
      }
      setResult(data.image);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Kon de mockup niet genereren.");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-ink">Zie het op je eigen foto</h3>
          <p className="mt-1 text-xs text-muted">{calc.mockup.description}</p>
        </div>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="mt-1 shrink-0 text-muted"
          aria-hidden
        >
          ›
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {calc.mockup.uploadLabel}
                </span>
                <motion.button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  whileTap={{ scale: 0.99 }}
                  className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-page text-center transition-colors hover:border-accent"
                >
                  {photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={photo} alt="Bron" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-xs text-muted">Klik om te uploaden</span>
                  )}
                </motion.button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={onFile}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Mockup
                </span>
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-line bg-page text-center">
                  {status === "busy" && (
                    <span className="animate-pulse px-2 text-xs text-muted">Bezig…</span>
                  )}
                  {status !== "busy" && result && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <motion.img
                      key={result}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      src={result}
                      alt="Mockup"
                      className="h-full w-full object-cover"
                    />
                  )}
                  {status !== "busy" && !result && (
                    <span className="px-2 text-xs text-muted">Verschijnt hier</span>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="mt-2 text-xs text-accent-600">{error}</p>}

            <motion.button
              type="button"
              onClick={generate}
              disabled={!photo || status === "busy"}
              whileTap={{ scale: 0.97 }}
              className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {result ? "Opnieuw genereren" : "Genereer mockup"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
