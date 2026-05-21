// Live eligibility checks for Dutch national subsidies, tied to the public
// schemes administered by RVO on behalf of the Rijksoverheid.
//
// Source of truth (always authoritative over the indicative figures here):
//   ISDE woningeigenaren — https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren
//   Energiebesparing thuis — https://www.rijksoverheid.nl/onderwerpen/energie-thuis
//
// Amounts and minimum surfaces follow the published ISDE rules; they are
// kept here so they are easy to update when RVO revises the scheme.

import type { Values } from "./calculators";

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
  footnote?: string;
}

export interface Attestations {
  eigenaarBewoner: boolean;
  bestaandeWoning: boolean;
}

export const DEFAULT_ATTESTATIONS: Attestations = {
  eigenaarBewoner: false,
  bestaandeWoning: false,
};

// Official RVO subsidy finder, used when no specific scheme applies.
export const RVO_SUBSIDY_FINDER =
  "https://www.rvo.nl/subsidies-financiering";

// ISDE isolation rules (woningeigenaren). Minimum surface per measure (m²).
const ISDE_MIN_M2: Record<string, number> = {
  spouwmuur: 10,
  gevel: 10,
  dak: 20,
  vloer: 20,
  bodem: 20,
};

// Indicative ISDE contribution per m² for a single measure (doubles for 2+).
const ISDE_PER_M2: Record<string, number> = {
  spouwmuur: 8,
  vloer: 11,
  bodem: 7,
  dak: 23,
  gevel: 38,
};

const ISDE_LABEL: Record<string, string> = {
  spouwmuur: "spouwmuurisolatie",
  vloer: "vloerisolatie",
  bodem: "bodemisolatie",
  dak: "dakisolatie",
  gevel: "gevelisolatie",
};

export function evaluateGrants(
  slug: string,
  values: Values,
  att: Attestations,
): GrantResult[] {
  if (slug === "isolatie") {
    const type = String(values.type ?? "");
    const area = Number(values.oppervlak ?? 0);
    const minM2 = ISDE_MIN_M2[type] ?? 10;
    const perM2 = ISDE_PER_M2[type] ?? 0;

    const criteria: GrantCriterion[] = [
      { label: "Je bent eigenaar én bewoner van de woning", met: att.eigenaarBewoner },
      { label: "Het betreft een bestaande woning (geen nieuwbouw)", met: att.bestaandeWoning },
      {
        label: `Minimaal ${minM2} m² ${ISDE_LABEL[type] ?? "isolatie"} — nu ${area} m²`,
        met: area >= minM2,
      },
    ];
    const eligible = criteria.every((c) => c.met);

    return [
      {
        id: "isde",
        name: "ISDE — isolatiesubsidie",
        authority: "RVO namens de Rijksoverheid",
        url: "https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren",
        summary:
          "Investeringssubsidie duurzame energie en energiebesparing voor het isoleren van bestaande koopwoningen.",
        criteria,
        eligible,
        estimate: eligible ? Math.round(perM2 * area) : undefined,
        estimateLabel: `± € ${perM2}/m² — het bedrag verdubbelt bij twee of meer maatregelen`,
        footnote:
          "Het isolatiemateriaal moet voldoen aan de minimale Rd-waarde van RVO en je vraagt de subsidie binnen 24 maanden na uitvoering aan. Bedragen zijn indicatief; RVO is leidend.",
      },
    ];
  }

  // Stucwerk, schilderwerk, opbouw/uitbouw: no national scheme applies.
  return [];
}
