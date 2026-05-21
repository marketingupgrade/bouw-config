// Indicative consumer (incl. btw) cost models for the quick calculators.
// Prices are realistic Dutch market ballparks for 2025 and are deliberately
// kept in this one file so they are trivial to tune without touching UI code.

import { ISDE_MEASURES } from "./isde";

export type FieldType = "number" | "select" | "toggle";

export interface SelectOption {
  id: string;
  label: string;
  hint?: string;
  priceHint?: string;
}

interface FieldBase {
  key: string;
  label: string;
  help?: string;
}

export interface NumberField extends FieldBase {
  type: "number";
  unit?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  control?: "input" | "stepper";
}

export interface SelectField extends FieldBase {
  type: "select";
  options: SelectOption[];
  default: string;
}

export interface ToggleField extends FieldBase {
  type: "toggle";
  default: boolean;
}

export type Field = NumberField | SelectField | ToggleField;
export type FieldValue = number | string | boolean;
export type Values = Record<string, FieldValue>;

export interface EstimateLine {
  label: string;
  amount: number;
  detail?: string;
}

export interface Estimate {
  lines: EstimateLine[];
  total: number;
  low: number;
  high: number;
  unitLabel?: string; // e.g. "€ 24/m²"
  notes?: string[];
}

export interface Calculator {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  accent: string; // hex used for the hub card accent
  fields: Field[];
  estimate: (v: Values) => Estimate;
}

// --- helpers -------------------------------------------------------------

const num = (v: FieldValue | undefined, fallback = 0): number =>
  typeof v === "number" ? v : fallback;
const str = (v: FieldValue | undefined, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const opt = (id: string, map: Record<string, number>): number => map[id] ?? 0;

function band(total: number, spread: number): { low: number; high: number } {
  return {
    low: Math.round((total * (1 - spread)) / 10) * 10,
    high: Math.round((total * (1 + spread)) / 10) * 10,
  };
}

export function defaultValues(calc: Calculator): Values {
  const v: Values = {};
  for (const f of calc.fields) v[f.key] = f.default;
  return v;
}

export function labelFor(field: SelectField, id: string): string {
  return field.options.find((o) => o.id === id)?.label ?? id;
}

// Short human-readable summary of the chosen values, for wishlist items.
export function summarizeValues(calc: Calculator, values: Values): string {
  const parts: string[] = [];
  for (const f of calc.fields) {
    const v = values[f.key];
    if (f.type === "select") parts.push(labelFor(f, String(v)));
    else if (f.type === "number") {
      if (Number(v) > 0) parts.push(`${v}${f.unit ? ` ${f.unit}` : ""}`);
    } else if (v) parts.push(f.label);
  }
  return parts.join(" · ");
}

// --- modules -------------------------------------------------------------

const stucwerk: Calculator = {
  slug: "stucwerk",
  title: "Stucwerk",
  tagline: "Wanden en plafonds strak laten stucen",
  description:
    "Bereken een richtprijs voor glad pleisterwerk, spuitwerk of sierpleister op basis van oppervlakte, afwerking en ondergrond.",
  accent: "#6b7f5b",
  fields: [
    {
      key: "onderdeel",
      label: "Wat laat je stucen?",
      type: "select",
      default: "wand",
      options: [
        { id: "wand", label: "Wanden", hint: "Standaardtarief" },
        { id: "plafond", label: "Plafond", hint: "Bovenhands werk, +30%" },
        { id: "beide", label: "Wanden en plafond", hint: "Gemengd" },
      ],
    },
    {
      key: "afwerking",
      label: "Soort afwerking",
      type: "select",
      default: "sausklaar",
      options: [
        { id: "spuitwerk", label: "Spuitwerk", hint: "Korrelige spuitlaag", priceHint: "vanaf € 12/m²" },
        { id: "behangklaar", label: "Behangklaar", hint: "Glad, klaar voor behang", priceHint: "± € 19/m²" },
        { id: "sausklaar", label: "Sausklaar", hint: "Glad, klaar om te schilderen", priceHint: "± € 25/m²" },
        { id: "sierpleister", label: "Sierpleister", hint: "Decoratieve structuur", priceHint: "± € 16/m²" },
      ],
    },
    {
      key: "oppervlak",
      label: "Oppervlakte",
      type: "number",
      unit: "m²",
      min: 1,
      max: 1000,
      step: 1,
      default: 30,
    },
    {
      key: "ondergrond",
      label: "Staat van de ondergrond",
      type: "select",
      default: "nieuw",
      options: [
        { id: "nieuw", label: "Nieuwe / kale muur", hint: "Geen voorwerk" },
        { id: "bestaand", label: "Bestaande muur", hint: "Licht herstel, +€3/m²" },
        { id: "verwijderen", label: "Oud stucwerk eraf", hint: "Verwijderen + afvoer, +€9/m²" },
      ],
    },
    {
      key: "uitvlakken",
      label: "Uitvlakken vooraf",
      help: "Egaliseren van een ongelijke ondergrond (+€7/m²).",
      type: "toggle",
      default: false,
    },
  ],
  estimate: (v) => {
    const area = num(v.oppervlak);
    const base = opt(str(v.afwerking), {
      spuitwerk: 12,
      behangklaar: 19,
      sausklaar: 25,
      sierpleister: 16,
    });
    const factor = opt(str(v.onderdeel), { wand: 1, plafond: 1.3, beide: 1.12 });
    const ondergrond = opt(str(v.ondergrond), { nieuw: 0, bestaand: 3, verwijderen: 9 });
    const uitvlak = v.uitvlakken ? 7 : 0;
    const perM2 = base * factor + ondergrond + uitvlak;

    const lines: EstimateLine[] = [
      {
        label: "Stucwerk",
        detail: `${area} m² × € ${(base * factor).toFixed(0)}/m²`,
        amount: Math.round(base * factor * area),
      },
    ];
    if (ondergrond > 0)
      lines.push({ label: "Voorbewerking ondergrond", detail: `${area} m² × € ${ondergrond}/m²`, amount: ondergrond * area });
    if (uitvlak > 0)
      lines.push({ label: "Uitvlakken", detail: `${area} m² × € ${uitvlak}/m²`, amount: uitvlak * area });

    let total = lines.reduce((s, l) => s + l.amount, 0);
    if (total < 350 && total > 0) {
      lines.push({ label: "Minimum opdrachttarief", amount: 350 - total });
      total = 350;
    }
    return { lines, total, ...band(total, 0.12), unitLabel: `± € ${perM2.toFixed(0)}/m²` };
  },
};

const schilderwerk: Calculator = {
  slug: "schilderwerk",
  title: "Schilderwerk",
  tagline: "Muren, plafonds en houtwerk",
  description:
    "Richtprijs voor binnen- of buitenschilderwerk inclusief voorbehandeling, met losse posten voor deuren en kozijnen.",
  accent: "#8a6a45",
  fields: [
    {
      key: "locatie",
      label: "Binnen of buiten",
      type: "select",
      default: "binnen",
      options: [
        { id: "binnen", label: "Binnen", hint: "Latex muur/plafond", priceHint: "± € 11/m²" },
        { id: "buiten", label: "Buiten", hint: "Weerbestendig", priceHint: "± € 16/m²" },
      ],
    },
    {
      key: "muuroppervlak",
      label: "Te schilderen oppervlak",
      type: "number",
      unit: "m²",
      min: 0,
      max: 1000,
      step: 1,
      default: 40,
    },
    {
      key: "lagen",
      label: "Aantal lagen",
      type: "select",
      default: "2",
      options: [
        { id: "1", label: "1 laag", hint: "Bijwerken" },
        { id: "2", label: "2 lagen", hint: "Dekkend (advies)" },
        { id: "3", label: "3 lagen", hint: "Kleurverschil wegwerken" },
      ],
    },
    {
      key: "voorbehandeling",
      label: "Voorbehandeling",
      type: "select",
      default: "licht",
      options: [
        { id: "geen", label: "Geen", hint: "Schone, gladde ondergrond" },
        { id: "licht", label: "Licht schuren", hint: "+€2/m²" },
        { id: "zwaar", label: "Plamuren & gronden", hint: "+€6/m²" },
      ],
    },
    {
      key: "deuren",
      label: "Aantal deuren",
      help: "Lakwerk per deur (twee zijden).",
      type: "number",
      min: 0,
      max: 40,
      step: 1,
      default: 0,
      control: "stepper",
    },
    {
      key: "kozijnen",
      label: "Aantal kozijnen",
      help: "Raam- of deurkozijn inclusief lijstwerk.",
      type: "number",
      min: 0,
      max: 40,
      step: 1,
      default: 0,
      control: "stepper",
    },
  ],
  estimate: (v) => {
    const area = num(v.muuroppervlak);
    const base = opt(str(v.locatie), { binnen: 11, buiten: 16 });
    const lagen = opt(str(v.lagen), { "1": 0.65, "2": 1, "3": 1.3 });
    const voor = opt(str(v.voorbehandeling), { geen: 0, licht: 2, zwaar: 6 });
    const muurPerM2 = base * lagen + voor;
    const deuren = num(v.deuren);
    const kozijnen = num(v.kozijnen);

    const lines: EstimateLine[] = [];
    if (area > 0)
      lines.push({ label: "Muur-/plafondschilderwerk", detail: `${area} m² × € ${muurPerM2.toFixed(0)}/m²`, amount: Math.round(muurPerM2 * area) });
    if (deuren > 0) lines.push({ label: "Deuren lakken", detail: `${deuren} × € 45`, amount: deuren * 45 });
    if (kozijnen > 0) lines.push({ label: "Kozijnen lakken", detail: `${kozijnen} × € 70`, amount: kozijnen * 70 });

    let total = lines.reduce((s, l) => s + l.amount, 0);
    if (total < 250 && total > 0) {
      lines.push({ label: "Minimum opdrachttarief", amount: 250 - total });
      total = 250;
    }
    return { lines, total, ...band(total, 0.15), unitLabel: area > 0 ? `± € ${muurPerM2.toFixed(0)}/m²` : undefined };
  },
};

const isolatie: Calculator = {
  slug: "isolatie",
  title: "Isolatie & verduurzaming",
  tagline: "Bespaar energie en vraag subsidie aan",
  description:
    "Bereken de kosten van na-isolatie en zie direct de indicatieve ISDE-subsidie die je kunt aftrekken.",
  accent: "#4f7a4f",
  fields: [
    {
      key: "type",
      label: "Type isolatie",
      type: "select",
      default: "spouwmuur",
      options: [
        { id: "spouwmuur", label: "Spouwmuurisolatie", hint: "Inblazen", priceHint: "± € 22/m²" },
        { id: "vloer", label: "Vloerisolatie", hint: "Onderzijde vloer", priceHint: "± € 30/m²" },
        { id: "bodem", label: "Bodemisolatie", hint: "Kruipruimte", priceHint: "± € 17/m²" },
        { id: "dak", label: "Dakisolatie (binnen)", hint: "Binnenzijde dak", priceHint: "± € 55/m²" },
        { id: "gevel", label: "Gevelisolatie (buiten)", hint: "Buitenzijde + stuc", priceHint: "± € 125/m²" },
      ],
    },
    {
      key: "oppervlak",
      label: "Te isoleren oppervlak",
      type: "number",
      unit: "m²",
      min: 1,
      max: 1000,
      step: 1,
      default: 50,
    },
    {
      key: "subsidie",
      label: "ISDE-subsidie aftrekken",
      help: "Indicatieve subsidie voor woningeigenaren. Voorwaarden gelden.",
      type: "toggle",
      default: true,
    },
  ],
  estimate: (v) => {
    const area = num(v.oppervlak);
    const type = str(v.type);
    const base = opt(type, { spouwmuur: 22, vloer: 30, bodem: 17, dak: 55, gevel: 125 });
    const measure = ISDE_MEASURES[type];
    const subsidiePerM2 = measure?.perM2 ?? 0; // single-measure ISDE rate
    const saving = opt(type, { spouwmuur: 5, vloer: 4, bodem: 3, dak: 7, gevel: 9 }); // €/m²/jaar indicatief

    const gross = Math.round(base * area);
    const lines: EstimateLine[] = [
      { label: "Isolatie aanbrengen", detail: `${area} m² × € ${base}/m²`, amount: gross },
    ];
    let total = gross;
    if (v.subsidie && measure) {
      const sub = Math.round(subsidiePerM2 * area);
      lines.push({
        label: "ISDE-subsidie (indicatief)",
        detail: `${area} m² × € ${subsidiePerM2}/m²`,
        amount: -sub,
      });
      total = gross - sub;
    }
    const notes = [
      `Geschatte energiebesparing: ± € ${Math.round(saving * area).toLocaleString("nl-NL")} per jaar.`,
    ];
    if (v.subsidie)
      notes.push(
        "ISDE-subsidie verdubbelt bij twee of meer maatregelen. Check je exacte recht in de subsidiecheck hieronder.",
      );
    return { lines, total, ...band(total, 0.15), unitLabel: `± € ${base}/m²`, notes };
  },
};

const opbouwUitbouw: Calculator = {
  slug: "opbouw-uitbouw",
  title: "Opbouw & uitbouw",
  tagline: "Extra ruimte aan of op je woning",
  description:
    "Snelle richtprijs per m² voor een uitbouw op de begane grond, een opbouw (extra verdieping) of een dakkapel.",
  accent: "#5b6e7f",
  fields: [
    {
      key: "type",
      label: "Type uitbreiding",
      type: "select",
      default: "uitbouw",
      options: [
        { id: "uitbouw", label: "Uitbouw (begane grond)", hint: "Aanbouw achter/zijkant", priceHint: "± € 2.600/m²" },
        { id: "opbouw", label: "Opbouw (extra verdieping)", hint: "Verdieping erop", priceHint: "± € 2.300/m²" },
        { id: "dakkapel", label: "Dakkapel", hint: "Meer ruimte op zolder", priceHint: "± € 2.000/m²" },
      ],
    },
    {
      key: "oppervlak",
      label: "Oppervlakte",
      type: "number",
      unit: "m²",
      min: 2,
      max: 120,
      step: 1,
      default: 15,
    },
    {
      key: "afwerking",
      label: "Afwerkingsniveau",
      type: "select",
      default: "standaard",
      options: [
        { id: "casco", label: "Casco", hint: "Wind- en waterdicht, ×0,7" },
        { id: "standaard", label: "Standaard", hint: "Compleet afgewerkt" },
        { id: "hoogwaardig", label: "Hoogwaardig", hint: "Luxe afwerking, ×1,3" },
      ],
    },
    {
      key: "vergunning",
      label: "Inclusief vergunning & tekenwerk",
      help: "Constructieberekening, bouwtekening en aanvraag (+€2.500).",
      type: "toggle",
      default: false,
    },
  ],
  estimate: (v) => {
    const area = num(v.oppervlak);
    const base = opt(str(v.type), { uitbouw: 2600, opbouw: 2300, dakkapel: 2000 });
    const factor = opt(str(v.afwerking), { casco: 0.7, standaard: 1, hoogwaardig: 1.3 });
    const perM2 = base * factor;

    const lines: EstimateLine[] = [
      { label: "Ruwbouw + afwerking", detail: `${area} m² × € ${perM2.toLocaleString("nl-NL")}/m²`, amount: Math.round(perM2 * area) },
    ];
    if (v.vergunning) lines.push({ label: "Vergunning & tekenwerk", amount: 2500 });

    const total = lines.reduce((s, l) => s + l.amount, 0);
    return { lines, total, ...band(total, 0.15), unitLabel: `± € ${perM2.toLocaleString("nl-NL")}/m²` };
  },
};

export const CALCULATORS: Calculator[] = [stucwerk, schilderwerk, isolatie, opbouwUitbouw];

export function getCalculator(slug: string): Calculator | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
