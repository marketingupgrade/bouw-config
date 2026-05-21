// Live eligibility checks for Dutch national subsidies, tied to the public
// schemes administered by RVO on behalf of the Rijksoverheid.
//
// The ISDE figures live in ./isde.ts and follow the published standaardbedragen.
// They are indicative: the user applies themselves and RVO is authoritative.

import type { Values } from "./calculators";
import { ISDE_DISCLAIMER, ISDE_MEASURES, ISDE_URL, ISDE_YEAR } from "./isde";

export interface GrantCriterion {
  label: string;
  met: boolean;
}

export interface GrantResult {
  id: string;
  name: string;
  authority: string;
  url: string;
  summary: string;
  criteria: GrantCriterion[];
  eligible: boolean;
  estimate?: number;
  estimateLabel?: string;
  conditions?: string[];
  disclaimer: string;
}

export interface Attestations {
  eigenaarBewoner: boolean;
  bestaandeWoning: boolean;
  tweeMaatregelen: boolean;
}

export const DEFAULT_ATTESTATIONS: Attestations = {
  eigenaarBewoner: false,
  bestaandeWoning: false,
  tweeMaatregelen: false,
};

// Official RVO subsidy finder, used when no specific scheme applies.
export const RVO_SUBSIDY_FINDER = "https://www.rvo.nl/subsidies-financiering";

// The ISDE-eligible insulation measure a given module + state represents, if any.
export function currentMeasureId(slug: string, values: Values): string | undefined {
  if (slug === "isolatie") {
    return ISDE_MEASURES[String(values.type)] ? String(values.type) : undefined;
  }
  if (slug === "vloerverwarming" && values.vloerisolatie) return "vloer";
  return undefined;
}

export function evaluateGrants(
  slug: string,
  values: Values,
  att: Attestations,
): GrantResult[] {
  const measureId = currentMeasureId(slug, values);
  if (measureId) {
    const area = Number(values.oppervlak ?? 0);
    const m = ISDE_MEASURES[measureId];

    const perM2 = att.tweeMaatregelen ? m.perM2Multi : m.perM2;

    const criteria: GrantCriterion[] = [
      { label: "Je bent eigenaar én bewoner van de woning", met: att.eigenaarBewoner },
      { label: "Het betreft een bestaande woning (geen nieuwbouw)", met: att.bestaandeWoning },
      {
        label: `Minimaal ${m.minM2} m² ${m.label} — nu ${area} m²`,
        met: area >= m.minM2,
      },
    ];
    const eligible = criteria.every((c) => c.met);
    const estimate = eligible ? Math.round(perM2 * area) : undefined;

    return [
      {
        id: "isde",
        name: "ISDE — isolatiesubsidie",
        authority: "RVO namens de Rijksoverheid",
        url: ISDE_URL,
        summary:
          "Investeringssubsidie duurzame energie en energiebesparing voor het isoleren van bestaande koopwoningen.",
        criteria,
        eligible,
        estimate,
        estimateLabel: att.tweeMaatregelen
          ? `€ ${perM2}/m² (verhoogd tarief bij 2+ maatregelen, ISDE ${ISDE_YEAR})`
          : `€ ${perM2}/m² (1 maatregel) — verdubbelt naar € ${m.perM2Multi}/m² bij 2+ maatregelen`,
        conditions: [
          `Isolatie voldoet aan de eis: ${m.requirement}.`,
          "Je vraagt de subsidie binnen 24 maanden na uitvoering aan bij RVO.",
          "Het verhoogde tarief geldt alleen bij twee of meer energiebesparende maatregelen.",
        ],
        disclaimer: ISDE_DISCLAIMER,
      },
    ];
  }

  // Stucwerk, schilderwerk, opbouw/uitbouw: no national scheme applies.
  return [];
}
