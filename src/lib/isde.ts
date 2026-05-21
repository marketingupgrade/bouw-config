// ISDE insulation subsidy parameters for homeowners (woningeigenaren).
//
// Figures follow the published ISDE "standaardbedragen" per insulation
// measure: a base rate per m² for a single measure that DOUBLES when two or
// more energy-saving measures are carried out within the qualifying period.
// Each measure has a minimum treated surface and a minimum Rd insulation value.
//
// These are kept in one place so they are easy to update when RVO revises the
// scheme each year. RVO is always the authoritative source — the values here
// are indicative and used only to estimate a potential contribution.
//
// Authoritative source:
//   https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren

export interface IsdeMeasure {
  id: string;
  label: string;
  minM2: number; // minimum treated surface to qualify
  perM2: number; // € per m² — single measure
  perM2Multi: number; // € per m² — two or more measures (≈ double)
  rd: number; // minimum Rd insulation value (m²·K/W)
}

export const ISDE_MEASURES: Record<string, IsdeMeasure> = {
  spouwmuur: { id: "spouwmuur", label: "spouwmuurisolatie", minM2: 10, perM2: 8, perM2Multi: 16, rd: 1.1 },
  bodem: { id: "bodem", label: "bodemisolatie", minM2: 20, perM2: 4, perM2Multi: 8, rd: 3.5 },
  vloer: { id: "vloer", label: "vloerisolatie", minM2: 20, perM2: 7, perM2Multi: 14, rd: 3.5 },
  dak: { id: "dak", label: "dakisolatie", minM2: 20, perM2: 15, perM2Multi: 30, rd: 3.5 },
  gevel: { id: "gevel", label: "gevelisolatie", minM2: 10, perM2: 25, perM2Multi: 50, rd: 3.5 },
};

export const ISDE_URL = "https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren";

// Year the standaardbedragen above reflect; shown to the user for transparency.
export const ISDE_YEAR = "2025";

// Shown prominently wherever a subsidy amount is estimated.
export const ISDE_DISCLAIMER =
  "Indicatieve schatting op basis van de ISDE-standaardbedragen. Je vraagt de subsidie zélf aan bij RVO en bent zelf verantwoordelijk voor het voldoen aan alle voorwaarden. Aan dit bedrag kunnen geen rechten worden ontleend; RVO bepaalt de definitieve toekenning.";
