// Encode/decode tool state to and from the URL query string so any
// configuration or calculation can be bookmarked, resumed and shared.
// Only values that differ from the defaults are written, keeping links short.

import {
  CLADDINGS,
  DEFAULT_CONFIG,
  DIMENSIONS,
  EXTRA_BOUNDS,
  FRAME_COLORS,
  HEATINGS,
  INTERIORS,
  MODELS,
  ROOFS,
  type Configuration,
} from "./config";
import { defaultValues, type Calculator, type Values } from "./calculators";

// --- calculators ---------------------------------------------------------

export function encodeValues(calc: Calculator, values: Values): string {
  const p = new URLSearchParams();
  for (const f of calc.fields) {
    const v = values[f.key];
    if (v === f.default) continue;
    p.set(f.key, f.type === "toggle" ? (v ? "1" : "0") : String(v));
  }
  return p.toString();
}

export function decodeValues(calc: Calculator, search: string): Values {
  const p = new URLSearchParams(search);
  const v = defaultValues(calc);
  for (const f of calc.fields) {
    if (!p.has(f.key)) continue;
    const raw = p.get(f.key)!;
    if (f.type === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) v[f.key] = Math.max(f.min, Math.min(f.max, n));
    } else if (f.type === "select") {
      if (f.options.some((o) => o.id === raw)) v[f.key] = raw;
    } else {
      v[f.key] = raw === "1" || raw === "true";
    }
  }
  return v;
}

// --- 3D configurator -----------------------------------------------------

const ENUMS = {
  model: MODELS,
  cladding: CLADDINGS,
  roof: ROOFS,
  frameColor: FRAME_COLORS,
  heating: HEATINGS,
  interior: INTERIORS,
} as const;

const NUMS = {
  width: DIMENSIONS.width,
  depth: DIMENSIONS.depth,
  height: DIMENSIONS.height,
  schuifpuien: EXTRA_BOUNDS.schuifpuien,
  ramen: EXTRA_BOUNDS.ramen,
  dakramen: EXTRA_BOUNDS.dakramen,
  stopcontacten: EXTRA_BOUNDS.stopcontacten,
  spots: EXTRA_BOUNDS.spots,
} as const;

const BOOLS = ["buitenkraan", "zonwering", "luifel", "terras"] as const;

export function encodeConfig(config: Configuration): string {
  const p = new URLSearchParams();
  for (const key of Object.keys(config) as (keyof Configuration)[]) {
    const v = config[key];
    if (v === DEFAULT_CONFIG[key]) continue;
    p.set(key, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  return p.toString();
}

// Returns a sanitised Configuration when the URL carries state, else null.
export function decodeConfig(search: string): Configuration | null {
  const p = new URLSearchParams(search);
  if ([...p.keys()].length === 0) return null;

  const c: Configuration = { ...DEFAULT_CONFIG };
  let touched = false;

  for (const [key, list] of Object.entries(ENUMS)) {
    const raw = p.get(key);
    if (raw && list.some((o) => o.id === raw)) {
      (c[key as keyof Configuration] as string) = raw;
      touched = true;
    }
  }
  for (const [key, bounds] of Object.entries(NUMS)) {
    const raw = p.get(key);
    if (raw == null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      (c[key as keyof Configuration] as number) = Math.max(bounds.min, Math.min(bounds.max, n));
      touched = true;
    }
  }
  for (const key of BOOLS) {
    const raw = p.get(key);
    if (raw == null) continue;
    (c[key] as boolean) = raw === "1" || raw === "true";
    touched = true;
  }

  return touched ? c : null;
}
