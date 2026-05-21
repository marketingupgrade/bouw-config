"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { decodeValues, encodeValues } from "@/lib/share";
import {
  defaultValues,
  formatEur,
  getCalculator,
  labelFor,
  summarizeValues,
  type Calculator,
  type SelectField,
  type Values,
} from "@/lib/calculators";
import GrantsChecker from "@/components/GrantsChecker";
import AddToWishlist from "@/components/AddToWishlist";
import {
  CopyLinkButton,
  Field,
  NumberInput,
  OptionCard,
  OptionGrid,
  Stepper,
  ToggleRow,
} from "@/components/ui";

type Status = "idle" | "sending" | "done" | "error";

function FieldControl({
  calc,
  fieldKey,
  values,
  setValue,
}: {
  calc: Calculator;
  fieldKey: string;
  values: Values;
  setValue: (k: string, v: Values[string]) => void;
}) {
  const field = calc.fields.find((f) => f.key === fieldKey)!;

  if (field.type === "select") {
    const sel = field as SelectField;
    return (
      <Field label={field.label} hint={field.help}>
        <OptionGrid>
          {sel.options.map((o) => (
            <OptionCard
              key={o.id}
              selected={values[field.key] === o.id}
              onClick={() => setValue(field.key, o.id)}
              title={o.label}
              description={o.hint}
              price={o.priceHint}
            />
          ))}
        </OptionGrid>
      </Field>
    );
  }

  if (field.type === "number") {
    const v = Number(values[field.key]);
    return (
      <Field label={field.label} hint={field.help}>
        {field.control === "stepper" ? (
          <Stepper value={v} min={field.min} max={field.max} onChange={(n) => setValue(field.key, n)} />
        ) : (
          <NumberInput
            value={v}
            min={field.min}
            max={field.max}
            step={field.step}
            unit={field.unit}
            onChange={(n) => setValue(field.key, n)}
          />
        )}
      </Field>
    );
  }

  // toggle
  return (
    <div className="rounded-lg border border-line bg-surface px-4">
      <ToggleRow
        label={field.label}
        description={field.help}
        checked={Boolean(values[field.key])}
        onChange={(b) => setValue(field.key, b)}
      />
    </div>
  );
}

function LeadForm({
  calc,
  values,
  total,
}: {
  calc: Calculator;
  values: Values;
  total: number;
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const contact = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculator: calc.slug,
          values,
          estimate: total,
          contact,
          url: window.location.href,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="rounded-lg border border-accent bg-accent-50 p-6 text-center"
      >
        <h3 className="text-lg font-semibold text-ink">Bedankt voor je aanvraag!</h3>
        <p className="mt-2 text-sm text-ink-soft">
          We hebben je gegevens en richtprijs ontvangen en nemen binnen één
          werkdag contact met je op voor een vrijblijvende offerte op maat.
        </p>
      </motion.div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Naam" className={inputClass} />
        <input name="email" type="email" required placeholder="E-mailadres" className={inputClass} />
        <input name="phone" placeholder="Telefoonnummer" className={inputClass} />
        <input name="postcode" placeholder="Postcode" className={inputClass} />
      </div>
      <textarea name="message" rows={3} placeholder="Eventuele toelichting of vragen" className={inputClass} />
      <motion.button
        type="submit"
        disabled={status === "sending"}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
      >
        {status === "sending" ? "Versturen…" : "Vraag vrijblijvend offerte aan"}
      </motion.button>
      {status === "error" && (
        <p className="text-center text-sm text-accent-600">
          Er ging iets mis. Probeer het opnieuw of bel ons.
        </p>
      )}
      <p className="text-center text-xs text-muted">
        Dit is een indicatieve richtprijs. Aan deze calculator kunnen geen
        rechten worden ontleend.
      </p>
    </form>
  );
}

export default function CalculatorTool({ slug }: { slug: string }) {
  const calc = getCalculator(slug)!;
  const [values, setValues] = useState<Values>(() => defaultValues(calc));
  const setValue = (k: string, v: Values[string]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const estimate = useMemo(() => calc.estimate(values), [calc, values]);

  const query = encodeValues(calc, values);
  const sharePath = query ? `/calculator/${calc.slug}?${query}` : `/calculator/${calc.slug}`;
  const wishItem = {
    id: sharePath,
    kind: "calculator" as const,
    title: calc.title,
    summary: summarizeValues(calc, values),
    amount: estimate.total,
    amountLabel: `${formatEur(estimate.low)} – ${formatEur(estimate.high)}`,
    url: sharePath,
    measure: calc.slug === "isolatie" ? String(values.type) : undefined,
  };

  // Sync state to the URL so the calculation can be bookmarked, resumed and shared.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      setValues(decodeValues(calc, window.location.search));
      return;
    }
    const qs = encodeValues(calc, values);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [calc, values]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-5 lg:px-8">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-base font-semibold uppercase tracking-[0.18em] text-accent">
            Bureau Wijnschenk
          </Link>
          <span className="hidden text-sm text-muted sm:inline">{calc.title}</span>
        </div>
        <Link href="/" className="text-sm font-medium text-muted transition hover:text-accent">
          ← Alle calculators
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[1fr_360px] lg:px-8">
        {/* Inputs */}
        <div>
          <p className="eyebrow">Calculator</p>
          <h1 className="mb-1 mt-1 text-2xl font-bold text-ink">{calc.title}</h1>
          <p className="mb-7 max-w-prose text-sm text-muted">{calc.description}</p>
          <div className="space-y-7">
            {calc.fields.map((f) => (
              <FieldControl key={f.key} calc={calc} fieldKey={f.key} values={values} setValue={setValue} />
            ))}
          </div>
        </div>

        {/* Estimate + lead */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs text-muted">Geschatte richtprijs (incl. btw)</p>
            <motion.p
              key={`${estimate.low}-${estimate.high}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-1 text-3xl font-bold tabular-nums text-accent"
            >
              {formatEur(estimate.low)} – {formatEur(estimate.high)}
            </motion.p>
            {estimate.unitLabel && (
              <p className="mt-1 text-xs text-muted">Gemiddeld {estimate.unitLabel}</p>
            )}

            <motion.ul layout className="mt-4 space-y-2 border-t border-line pt-4">
              <AnimatePresence initial={false}>
                {estimate.lines.map((line) => (
                  <motion.li
                    key={line.label}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-baseline justify-between gap-4 overflow-hidden text-sm"
                  >
                    <span className="text-ink-soft">
                      {line.label}
                      {line.detail && <span className="ml-1 text-xs text-muted">({line.detail})</span>}
                    </span>
                    <span className={`shrink-0 tabular-nums ${line.amount < 0 ? "text-accent-600" : "text-ink"}`}>
                      {formatEur(line.amount)}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
            <motion.div layout className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold text-ink">
              <span>Richtprijs</span>
              <span className="tabular-nums">{formatEur(estimate.total)}</span>
            </motion.div>

            <AnimatePresence initial={false}>
              {estimate.notes?.map((n) => (
                <motion.p
                  key={n}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 text-xs leading-relaxed text-muted"
                >
                  {n}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <AddToWishlist item={wishItem} className="w-full" />
            <CopyLinkButton className="w-full justify-center" />
          </div>

          <div className="mt-6">
            <GrantsChecker slug={calc.slug} values={values} />
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-ink">Offerte aanvragen</h3>
            <LeadForm calc={calc} values={values} total={estimate.total} />
          </div>
        </aside>
      </div>
    </div>
    </MotionConfig>
  );
}
