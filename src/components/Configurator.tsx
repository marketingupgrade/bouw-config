"use client";

import dynamic from "next/dynamic";
import { computePrice, formatEur } from "@/lib/pricing";
import { STEPS, useConfigurator } from "@/lib/store";
import StepDimensions from "@/components/steps/StepDimensions";
import StepOptions from "@/components/steps/StepOptions";
import StepQuote from "@/components/steps/StepQuote";

const Viewer3D = dynamic(() => import("@/components/Viewer3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      3D-weergave laden…
    </div>
  ),
});

function StepNav() {
  const { step, goTo } = useConfigurator();
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(i as 0 | 1 | 2)}
              className="flex items-center gap-2"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                  active
                    ? "bg-accent text-white"
                    : done
                      ? "bg-ink text-white"
                      : "bg-line text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-5 bg-line sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function Configurator() {
  const { step, next, prev, config } = useConfigurator();
  const price = computePrice(config);
  const isLast = step === 2;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-5 lg:px-8">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-bold tracking-tight text-ink">DE PREFABRIEK</span>
          <span className="hidden text-sm text-muted sm:inline">Configurator</span>
        </div>
        <a
          href="#"
          className="hidden text-sm font-medium text-muted hover:text-accent sm:inline"
        >
          Hulp nodig?
        </a>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Viewer */}
        <div className="relative h-[42vh] min-h-[280px] bg-page lg:h-auto lg:flex-1">
          <Viewer3D />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-surface/85 px-3 py-1.5 text-xs text-muted backdrop-blur">
            Sleep om te draaien · scroll om te zoomen
          </div>
        </div>

        {/* Panel */}
        <div className="flex w-full flex-col border-t border-line bg-surface lg:w-[460px] lg:border-l lg:border-t-0">
          <div className="border-b border-line px-5 py-4 lg:px-7">
            <StepNav />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-7">
            <p className="eyebrow">Stap {step + 1} van 3</p>
            <h1 className="mb-6 mt-1 text-xl font-bold text-ink">{STEPS[step]}</h1>
            {step === 0 && <StepDimensions />}
            {step === 1 && <StepOptions />}
            {step === 2 && <StepQuote />}
          </div>

          {/* Sticky footer: live price + nav */}
          <div className="shrink-0 border-t border-line bg-surface px-5 py-4 lg:px-7">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted">Richtprijs incl. btw</p>
                <p className="text-2xl font-bold tabular-nums text-ink">
                  {formatEur(price.total)}
                </p>
              </div>
              <p className="text-xs text-muted">{price.area.toFixed(1)} m²</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-ink-soft disabled:opacity-40"
              >
                Terug
              </button>
              <button
                type="button"
                onClick={next}
                disabled={isLast}
                className="flex-1 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLast ? "Vul het formulier hieronder in" : "Volgende stap"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
