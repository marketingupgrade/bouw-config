"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  currentMeasureId,
  DEFAULT_ATTESTATIONS,
  evaluateGrants,
  RVO_SUBSIDY_FINDER,
  type Attestations,
} from "@/lib/grants";
import { ISDE_MEASURES } from "@/lib/isde";
import { formatEur, type Values } from "@/lib/calculators";
import { useWishlist } from "@/lib/wishlist";
import { useWoning } from "@/lib/woning";
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
  const wishlistItems = useWishlist((s) => s.items);
  const woning = useWoning((s) => s.woning);

  // Count distinct ISDE-eligible measures the user is pursuing: those already
  // on the wishlist plus the one currently being calculated. Two or more
  // automatically unlocks the higher ISDE rate.
  const measures = new Set<string>();
  for (const i of wishlistItems) if (i.measure && ISDE_MEASURES[i.measure]) measures.add(i.measure);
  const current = currentMeasureId(slug, values);
  if (current) measures.add(current);
  const autoMulti = measures.size >= 2;

  // A confirmed BAG address proves the property exists, so it always counts
  // as a bestaande woning for the subsidy check.
  const bagBestaandeWoning = Boolean(woning);

  const effectiveAtt: Attestations = {
    ...att,
    bestaandeWoning: att.bestaandeWoning || bagBestaandeWoning,
    tweeMaatregelen: att.tweeMaatregelen || autoMulti,
  };
  const grants = evaluateGrants(slug, values, effectiveAtt);

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
                  description={
                    bagBestaandeWoning
                      ? "Automatisch op basis van je BAG-woninggegevens"
                      : undefined
                  }
                  checked={effectiveAtt.bestaandeWoning}
                  onChange={(v) => !bagBestaandeWoning && setAtt((a) => ({ ...a, bestaandeWoning: v }))}
                />
                <ToggleRow
                  label="Twee of meer maatregelen"
                  description={
                    autoMulti
                      ? "Automatisch aan: je hebt 2+ isolatiemaatregelen in je wenslijst"
                      : "Verhoogd tarief bij 2+ energiebesparende maatregelen"
                  }
                  checked={effectiveAtt.tweeMaatregelen}
                  onChange={(v) => !autoMulti && setAtt((a) => ({ ...a, tweeMaatregelen: v }))}
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

            {g.conditions && g.conditions.length > 0 && (
              <ul className="mt-3 space-y-1">
                {g.conditions.map((c) => (
                  <li key={c} className="flex gap-2 text-xs leading-relaxed text-muted">
                    <span aria-hidden>•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 rounded-lg bg-page p-3 text-xs leading-relaxed text-muted">
              {g.disclaimer}
            </p>

            <div className="mt-4">
              <GovSource authority={g.authority} url={g.url} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
