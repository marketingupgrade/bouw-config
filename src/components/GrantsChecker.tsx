"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DEFAULT_ATTESTATIONS,
  evaluateGrants,
  RVO_SUBSIDY_FINDER,
  type Attestations,
} from "@/lib/grants";
import { formatEur, type Values } from "@/lib/calculators";
import { ToggleRow } from "@/components/ui";

const RIJKSBLAUW = "#154273";

// A citation-style source label in the Rijkshuisstijl colour that links to the
// official documentation. Deliberately not the protected Rijksoverheid ribbon.
function GovSource({ authority, url }: { authority: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{ borderColor: `${RIJKSBLAUW}33`, color: RIJKSBLAUW }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2 4 6v5c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V6l-8-4Z"
          fill={RIJKSBLAUW}
          opacity="0.12"
        />
        <path
          d="M12 2 4 6v5c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V6l-8-4Z"
          stroke={RIJKSBLAUW}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="m9 12 2 2 4-4" stroke={RIJKSBLAUW} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="whitespace-nowrap">Bron: {authority}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

function CriterionRow({ label, met }: { label: string; met: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <motion.span
        animate={{ scale: met ? [1, 1.25, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          met ? "bg-accent" : "bg-line"
        }`}
        aria-hidden
      >
        {met ? "✓" : ""}
      </motion.span>
      <span className={met ? "text-ink" : "text-muted"}>{label}</span>
    </li>
  );
}

export default function GrantsChecker({ slug, values }: { slug: string; values: Values }) {
  const [att, setAtt] = useState<Attestations>(DEFAULT_ATTESTATIONS);
  const grants = evaluateGrants(slug, values, att);

  if (grants.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-ink">Subsidiecheck</h3>
        <p className="mt-1 text-sm text-muted">
          Voor dit type werk is geen landelijke subsidie bekend. Mogelijk biedt
          je gemeente een regeling — check de subsidiewijzer.
        </p>
        <div className="mt-3">
          <GovSource authority="Rijksoverheid · RVO.nl" url={RVO_SUBSIDY_FINDER} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grants.map((g) => (
        <div key={g.id} className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-start justify-between gap-3 border-b border-line p-5 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Subsidiecheck — {g.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{g.summary}</p>
            </div>
          </div>

          <div className="p-5 pt-4">
            <div className="rounded-lg border border-line">
              <div className="px-4">
                <ToggleRow
                  label="Eigenaar én bewoner"
                  checked={att.eigenaarBewoner}
                  onChange={(v) => setAtt((a) => ({ ...a, eigenaarBewoner: v }))}
                />
                <ToggleRow
                  label="Bestaande woning"
                  checked={att.bestaandeWoning}
                  onChange={(v) => setAtt((a) => ({ ...a, bestaandeWoning: v }))}
                />
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {g.criteria.map((c) => (
                <CriterionRow key={c.label} label={c.label} met={c.met} />
              ))}
            </ul>

            <AnimatePresence mode="wait">
              {g.eligible ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-lg border border-accent bg-accent-50 p-4"
                >
                  <p className="text-sm font-semibold text-ink">
                    Je komt waarschijnlijk in aanmerking
                    {g.estimate != null && (
                      <>
                        {" "}— geschat <span className="text-accent">{formatEur(g.estimate)}</span>
                      </>
                    )}
                  </p>
                  {g.estimateLabel && <p className="mt-1 text-xs text-ink-soft">{g.estimateLabel}</p>}
                </motion.div>
              ) : (
                <motion.p
                  key="todo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-lg border border-line bg-page p-4 text-sm text-muted"
                >
                  Voldoe aan alle voorwaarden hierboven om in aanmerking te komen.
                </motion.p>
              )}
            </AnimatePresence>

            {g.footnote && <p className="mt-3 text-xs leading-relaxed text-muted">{g.footnote}</p>}

            <div className="mt-4">
              <GovSource authority={g.authority} url={g.url} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
