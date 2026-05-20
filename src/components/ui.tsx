"use client";

import { EXTRA_BOUNDS } from "@/lib/config";

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
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
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
    </button>
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
        <span className="text-lg font-semibold text-ink">{value.toFixed(1)}</span>
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
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-soft transition hover:text-accent disabled:opacity-30"
        aria-label="Minder"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-soft transition hover:text-accent disabled:opacity-30"
        aria-label="Meer"
      >
        +
      </button>
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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 border-t border-line py-3 text-left first:border-t-0"
    >
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export const bounds = EXTRA_BOUNDS;
