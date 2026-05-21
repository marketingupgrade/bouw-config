"use client";

import { motion } from "motion/react";
import { EXTRA_BOUNDS } from "@/lib/config";

// Shared interaction feel for tappable controls.
const tap = { scale: 0.97 };
const springy = { type: "spring" as const, stiffness: 400, damping: 25 };

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-ink">{label}</label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>;
}

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  swatch,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  swatch?: string;
  price?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      whileTap={tap}
      whileHover={{ y: -2 }}
      transition={springy}
      className={`group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-accent bg-accent-50 ring-1 ring-accent"
          : "border-line bg-surface hover:border-ink-soft"
      }`}
    >
      {swatch && (
        <span
          className="mt-0.5 h-9 w-9 shrink-0 rounded-md border border-black/10"
          style={{ background: swatch }}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {price && <span className="shrink-0 text-xs font-medium text-muted">{price}</span>}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
        )}
      </span>
    </motion.button>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  suffix = "m",
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
      />
      <div className="flex w-24 shrink-0 items-baseline justify-end gap-1 tabular-nums">
        <motion.span
          key={value}
          initial={{ scale: 1.18, color: "var(--color-accent, #3f6f3f)" }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="text-lg font-semibold text-ink"
        >
          {value.toFixed(1)}
        </motion.span>
        <span className="text-xs text-muted">{suffix}</span>
      </div>
    </div>
  );
}

export function Stepper({
  value,
  min = 0,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface">
      <motion.button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        whileTap={{ scale: 0.8 }}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-soft transition-colors hover:text-accent disabled:opacity-30"
        aria-label="Minder"
      >
        −
      </motion.button>
      <motion.span
        key={value}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 20 }}
        className="w-8 text-center text-sm font-semibold tabular-nums"
      >
        {value}
      </motion.span>
      <motion.button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        whileTap={{ scale: 0.8 }}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-soft transition-colors hover:text-accent disabled:opacity-30"
        aria-label="Meer"
      >
        +
      </motion.button>
    </div>
  );
}

export function NumberInput({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="w-full bg-transparent py-2.5 text-sm text-ink outline-none tabular-nums"
      />
      {unit && <span className="shrink-0 text-sm text-muted">{unit}</span>}
    </div>
  );
}

export function CounterRow({
  label,
  value,
  bounds,
  onChange,
}: {
  label: string;
  value: number;
  bounds: { min: number; max: number };
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
      <span className="text-sm text-ink">{label}</span>
      <Stepper value={value} min={bounds.min} max={bounds.max} onChange={onChange} />
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.99 }}
      className="flex w-full items-center justify-between gap-3 border-t border-line py-3 text-left first:border-t-0"
    >
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <motion.span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </span>
    </motion.button>
  );
}

export const bounds = EXTRA_BOUNDS;
