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
    if (f.type === "select") {
      if (String(v) !== "geen") parts.push(labelFor(f, String(v)));
    } else if (f.type === "number") {
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
        { id: "hrpp", label: "HR++-glas", hint: "Vervangt enkel/dubbel glas", priceHint: "± € 230/m²" },
        { id: "triple", label: "Triple glas", hint: "Maximale isolatie", priceHint: "± € 380/m²" },
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
    const base = opt(type, { spouwmuur: 22, vloer: 30, bodem: 17, dak: 55, gevel: 125, hrpp: 230, triple: 380 });
    const measure = ISDE_MEASURES[type];
    const subsidiePerM2 = measure?.perM2 ?? 0; // single-measure ISDE rate
    const saving = opt(type, { spouwmuur: 5, vloer: 4, bodem: 3, dak: 7, gevel: 9, hrpp: 8, triple: 11 }); // €/m²/jaar indicatief

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

const badkamer: Calculator = {
  slug: "badkamer",
  title: "Badkamer",
  tagline: "Volledig naar wens samengesteld",
  description:
    "Stel je badkamer tot in detail samen: afwerkingsniveau, tegelwerk, douche, toilet, wastafel, verwarming en extra's zoals een was- en drooghoek. De richtprijs rekent live mee.",
  accent: "#4f7d86",
  fields: [
    {
      key: "oppervlak",
      label: "Oppervlakte badkamer",
      type: "number",
      unit: "m²",
      min: 2,
      max: 30,
      step: 1,
      default: 6,
    },
    {
      key: "niveau",
      label: "Afwerkingsniveau",
      type: "select",
      default: "standaard",
      options: [
        { id: "budget", label: "Budget", hint: "Functioneel en degelijk", priceHint: "± € 900/m²" },
        { id: "standaard", label: "Standaard", hint: "Compleet, goede kwaliteit", priceHint: "± € 1.400/m²" },
        { id: "luxe", label: "Luxe", hint: "Hoogwaardige materialen", priceHint: "± € 2.200/m²" },
      ],
    },
    {
      key: "tegelwerk",
      label: "Tegelwerk",
      type: "select",
      default: "wandenvloer",
      options: [
        { id: "geen", label: "Geen", hint: "Bestaand tegelwerk blijft" },
        { id: "wanden", label: "Wanden", hint: "Wandtegels, +€120/m²" },
        { id: "wandenvloer", label: "Wanden en vloer", hint: "Volledig betegeld, +€180/m²" },
        { id: "natuursteen", label: "Natuursteen / groot formaat", hint: "Premium tegels, +€320/m²" },
      ],
    },
    {
      key: "douche",
      label: "Douche",
      type: "select",
      default: "inloop",
      options: [
        { id: "geen", label: "Geen", hint: "Geen douche" },
        { id: "cabine", label: "Douchecabine", hint: "Compleet, +€900", priceHint: "+ € 900" },
        { id: "inloop", label: "Inloopdouche", hint: "Glaswand, +€1.200", priceHint: "+ € 1.200" },
        { id: "regen", label: "Regendouche", hint: "Inbouw + glaswand, +€1.800", priceHint: "+ € 1.800" },
      ],
    },
    {
      key: "toilet",
      label: "Toilet",
      type: "select",
      default: "hangend",
      options: [
        { id: "geen", label: "Geen", hint: "Geen toilet" },
        { id: "staand", label: "Staand toilet", hint: "+€350", priceHint: "+ € 350" },
        { id: "hangend", label: "Hangend toilet", hint: "Met inbouwreservoir, +€650", priceHint: "+ € 650" },
      ],
    },
    {
      key: "wastafel",
      label: "Wastafel",
      type: "select",
      default: "enkel",
      options: [
        { id: "geen", label: "Geen", hint: "Geen wastafel" },
        { id: "enkel", label: "Enkel meubel", hint: "+€650", priceHint: "+ € 650" },
        { id: "dubbel", label: "Dubbel meubel", hint: "Twee wasbakken, +€1.150", priceHint: "+ € 1.150" },
      ],
    },
    {
      key: "verwarming",
      label: "Verwarming",
      type: "select",
      default: "vloer",
      options: [
        { id: "geen", label: "Geen", hint: "Bestaande verwarming blijft" },
        { id: "vloer", label: "Vloerverwarming", hint: "Elektrisch, +€110/m²" },
        { id: "radiator", label: "Designradiator", hint: "Handdoekradiator, +€550" },
        { id: "beide", label: "Vloerverwarming + radiator", hint: "Beide" },
      ],
    },
    {
      key: "wasopstelling",
      label: "Was- en drooghoek",
      help: "Aansluiting voor wasmachine (en droger) in de badkamer — naar Duits voorbeeld.",
      type: "select",
      default: "geen",
      options: [
        { id: "geen", label: "Geen", hint: "Geen wasaansluiting" },
        { id: "wasmachine", label: "Wasmachine", hint: "Watertoevoer, afvoer + groep, +€450", priceHint: "+ € 450" },
        { id: "combi", label: "Wasmachine + droger", hint: "Incl. ombouwkast en extra groep, +€950", priceHint: "+ € 950" },
      ],
    },
    {
      key: "ligbad",
      label: "Ligbad",
      help: "Vrijstaand of inbouwbad (+€1.500).",
      type: "toggle",
      default: false,
    },
    {
      key: "spiegelkast",
      label: "Verlichte spiegelkast",
      help: "Spiegelkast met led-verlichting (+€350).",
      type: "toggle",
      default: true,
    },
    {
      key: "ventilatie",
      label: "Mechanische ventilatie",
      help: "Vochtgestuurde afzuiging (+€450).",
      type: "toggle",
      default: true,
    },
    {
      key: "sloop",
      label: "Sloop & afvoer oude badkamer",
      help: "Verwijderen en afvoeren van de bestaande badkamer (+€70/m²).",
      type: "toggle",
      default: true,
    },
  ],
  estimate: (v) => {
    const area = num(v.oppervlak);
    const niveau = str(v.niveau);
    const perM2 = opt(niveau, { budget: 900, standaard: 1400, luxe: 2200 });
    const niveauLabel = { budget: "budget", standaard: "standaard", luxe: "luxe" }[niveau] ?? "";
    const tegel = opt(str(v.tegelwerk), { geen: 0, wanden: 120, wandenvloer: 180, natuursteen: 320 });

    const lines: EstimateLine[] = [
      {
        label: `Verbouwing & installatie (${niveauLabel})`,
        detail: `${area} m² × € ${perM2.toLocaleString("nl-NL")}/m²`,
        amount: Math.round(perM2 * area),
      },
    ];
    if (tegel > 0)
      lines.push({ label: "Tegelwerk", detail: `${area} m² × € ${tegel}/m²`, amount: tegel * area });
    if (v.sloop)
      lines.push({ label: "Sloop & afvoer", detail: `${area} m² × € 70/m²`, amount: 70 * area });

    const verw = str(v.verwarming);
    if (verw === "vloer" || verw === "beide")
      lines.push({ label: "Vloerverwarming", detail: `${area} m² × € 110/m²`, amount: 110 * area });
    if (verw === "radiator" || verw === "beide")
      lines.push({ label: "Designradiator", amount: 550 });

    const douche = opt(str(v.douche), { geen: 0, cabine: 900, inloop: 1200, regen: 1800 });
    const doucheLabel = { cabine: "Douchecabine", inloop: "Inloopdouche", regen: "Regendouche" }[str(v.douche)];
    if (douche > 0) lines.push({ label: doucheLabel ?? "Douche", amount: douche });

    const toilet = opt(str(v.toilet), { geen: 0, staand: 350, hangend: 650 });
    if (toilet > 0)
      lines.push({ label: str(v.toilet) === "staand" ? "Staand toilet" : "Hangend toilet", amount: toilet });

    const wastafel = opt(str(v.wastafel), { geen: 0, enkel: 650, dubbel: 1150 });
    if (wastafel > 0)
      lines.push({ label: str(v.wastafel) === "dubbel" ? "Dubbel wastafelmeubel" : "Wastafelmeubel", amount: wastafel });

    const was = opt(str(v.wasopstelling), { geen: 0, wasmachine: 450, combi: 950 });
    if (was > 0)
      lines.push({
        label: str(v.wasopstelling) === "combi" ? "Wasmachine + droger (incl. kast)" : "Wasmachineaansluiting",
        amount: was,
      });

    if (v.ligbad) lines.push({ label: "Ligbad", amount: 1500 });
    if (v.spiegelkast) lines.push({ label: "Verlichte spiegelkast", amount: 350 });
    if (v.ventilatie) lines.push({ label: "Mechanische ventilatie", amount: 450 });

    let total = lines.reduce((s, l) => s + l.amount, 0);
    if (total < 1500 && total > 0) {
      lines.push({ label: "Minimum opdrachttarief", amount: 1500 - total });
      total = 1500;
    }
    return { lines, total, ...band(total, 0.15), unitLabel: `± € ${perM2.toLocaleString("nl-NL")}/m²` };
  },
};

const vloerverwarming: Calculator = {
  slug: "vloerverwarming",
  title: "Vloerverwarming",
  tagline: "Comfortabel en warmtepomp-klaar",
  description:
    "Richtprijs voor vloerverwarming: elektrisch of watergedragen, infrezen in een bestaande vloer of in een nieuwe dekvloer, inclusief verdeler en regeling.",
  accent: "#c2703d",
  fields: [
    {
      key: "oppervlak",
      label: "Te verwarmen oppervlak",
      type: "number",
      unit: "m²",
      min: 2,
      max: 400,
      step: 1,
      default: 40,
    },
    {
      key: "systeem",
      label: "Systeem",
      type: "select",
      default: "watergedragen",
      options: [
        { id: "watergedragen", label: "Watergedragen", hint: "Op cv-ketel of warmtepomp", priceHint: "± € 60/m²" },
        { id: "elektrisch", label: "Elektrisch", hint: "Renovatie of badkamer", priceHint: "± € 80/m²" },
      ],
    },
    {
      key: "methode",
      label: "Aanleg",
      type: "select",
      default: "infrezen",
      options: [
        { id: "infrezen", label: "Infrezen in bestaande vloer", hint: "Geen nieuwe dekvloer nodig" },
        { id: "dekvloer", label: "In nieuwe dekvloer", hint: "Inclusief dekvloer, +€25/m²" },
        { id: "nieuwbouw", label: "Tijdens nieuwbouw", hint: "Voordeliger, −€10/m²" },
      ],
    },
    {
      key: "groepen",
      label: "Aantal verwarmingsgroepen",
      help: "Aparte zones/kringen op de verdeler (ca. één per ruimte).",
      type: "number",
      min: 1,
      max: 16,
      step: 1,
      default: 4,
      control: "stepper",
    },
    {
      key: "thermostaat",
      label: "Thermostaat",
      type: "select",
      default: "standaard",
      options: [
        { id: "geen", label: "Geen", hint: "Bestaande thermostaat" },
        { id: "standaard", label: "Standaard", hint: "+€120" },
        { id: "slim", label: "Slim (wifi)", hint: "Per zone regelbaar, +€280" },
      ],
    },
    {
      key: "vloerisolatie",
      label: "Vloerisolatie toevoegen",
      help: "Isolatieplaten onder de vloerverwarming — komt in aanmerking voor ISDE-subsidie (+€30/m²).",
      type: "toggle",
      default: false,
    },
    {
      key: "verdeler",
      label: "Inclusief verdeler & regeling",
      help: "Verdeelunit met pompgroep — nodig bij watergedragen systemen (+€450).",
      type: "toggle",
      default: true,
    },
    {
      key: "vloerverwijderen",
      label: "Bestaande vloer verwijderen",
      help: "Slopen en afvoeren van de huidige vloer (+€15/m²).",
      type: "toggle",
      default: false,
    },
  ],
  estimate: (v) => {
    const area = num(v.oppervlak);
    const systeem = str(v.systeem);
    const base = opt(systeem, { watergedragen: 60, elektrisch: 80 });
    const methode = opt(str(v.methode), { infrezen: 0, dekvloer: 25, nieuwbouw: -10 });
    const perM2 = base + methode;
    const systeemLabel = systeem === "elektrisch" ? "elektrisch" : "watergedragen";

    const lines: EstimateLine[] = [
      {
        label: `Vloerverwarming (${systeemLabel})`,
        detail: `${area} m² × € ${perM2}/m²`,
        amount: Math.round(perM2 * area),
      },
    ];
    if (v.vloerverwijderen)
      lines.push({ label: "Bestaande vloer verwijderen", detail: `${area} m² × € 15/m²`, amount: 15 * area });
    if (v.vloerisolatie)
      lines.push({ label: "Vloerisolatie", detail: `${area} m² × € 30/m²`, amount: 30 * area });
    if (v.verdeler) lines.push({ label: "Verdeler & regeling", amount: 450 });

    const groepen = num(v.groepen);
    if (groepen > 0)
      lines.push({ label: "Verwarmingsgroepen", detail: `${groepen} × € 75`, amount: groepen * 75 });

    const thermostaat = opt(str(v.thermostaat), { geen: 0, standaard: 120, slim: 280 });
    if (thermostaat > 0)
      lines.push({ label: str(v.thermostaat) === "slim" ? "Slimme thermostaat" : "Thermostaat", amount: thermostaat });

    let total = lines.reduce((s, l) => s + l.amount, 0);
    if (total < 750 && total > 0) {
      lines.push({ label: "Minimum opdrachttarief", amount: 750 - total });
      total = 750;
    }
    return { lines, total, ...band(total, 0.15), unitLabel: `± € ${perM2}/m²` };
  },
};

const kozijnen: Calculator = {
  slug: "kozijnen",
  title: "Kozijnen op maat",
  tagline: "Vensters samenstellen in een paar stappen",
  description:
    "Stel een kozijn op maat samen: materiaal, buitenmaten, indeling, vulling, beglazing en afwerking. De richtprijs en richtlevertijd rekenen live mee.",
  accent: "#2b5a8a",
  fields: [
    {
      key: "materiaal",
      label: "Materiaal",
      type: "select",
      default: "kunststof",
      options: [
        { id: "hout", label: "Hout (Meranti, FSC)", hint: "Massief, kleurbaar", priceHint: "± € 450/m²" },
        { id: "kunststof", label: "Kunststof (PVC)", hint: "Onderhoudsarm", priceHint: "± € 380/m²" },
        { id: "aluminium", label: "Aluminium", hint: "Slank profiel", priceHint: "± € 620/m²" },
        { id: "staal", label: "Staal", hint: "Industrieel/strak", priceHint: "± € 750/m²" },
      ],
    },
    {
      key: "breedte",
      label: "Buitenmaat breedte",
      type: "number",
      unit: "mm",
      min: 400,
      max: 3000,
      step: 10,
      default: 1200,
    },
    {
      key: "hoogte",
      label: "Buitenmaat hoogte",
      type: "number",
      unit: "mm",
      min: 400,
      max: 3000,
      step: 10,
      default: 1400,
    },
    {
      key: "indeling",
      label: "Indeling",
      type: "select",
      default: "enkel",
      options: [
        { id: "enkel", label: "Enkel vak", hint: "Eén opening" },
        { id: "horizontaal", label: "2-vaks horizontaal", hint: "Met bovenlicht, +€180" },
        { id: "verticaal", label: "2-vaks verticaal", hint: "Verticaal gedeeld, +€180" },
        { id: "vierdelig", label: "4-vaks (kruisdeling)", hint: "+€420" },
      ],
    },
    {
      key: "vulling",
      label: "Type vulling",
      type: "select",
      default: "draaikiep",
      options: [
        { id: "vast", label: "Vast glas", hint: "Niet te openen" },
        { id: "draaikiep", label: "Draaikiep", hint: "Te openen + ventilatie, +€220" },
        { id: "combi", label: "Vast + draaikiep", hint: "+€280" },
      ],
    },
    {
      key: "beglazing",
      label: "Beglazing",
      type: "select",
      default: "hrpp",
      options: [
        { id: "hrpp", label: "HR++ glas", hint: "Standaard isolerend" },
        { id: "triple", label: "Triple glas", hint: "Maximale isolatie, +€80/m²" },
        { id: "matglas", label: "Matglas / privacy", hint: "+€40/m²" },
        { id: "zonwerend", label: "Zonwerend glas", hint: "+€60/m²" },
      ],
    },
    {
      key: "dorpel",
      label: "Onderdorpel",
      type: "select",
      default: "kunststeen",
      options: [
        { id: "geen", label: "Geen aparte dorpel" },
        { id: "kunststeen", label: "Kunststeen (composiet)", hint: "+€120/m" },
        { id: "hardhout", label: "Hardhout", hint: "+€180/m" },
        { id: "aluminium", label: "Aluminium", hint: "+€220/m" },
      ],
    },
    {
      key: "kleurBinnen",
      label: "Kleur binnen",
      type: "select",
      default: "wit",
      options: [
        { id: "wit", label: "Wit (RAL 9010)", hint: "Standaard" },
        { id: "antraciet", label: "Antraciet (RAL 7016)", hint: "+€90" },
        { id: "hout", label: "Houtnerf folie", hint: "+€120" },
        { id: "opaanvraag", label: "Kleur op aanvraag", hint: "+€200" },
      ],
    },
    {
      key: "kleurBuiten",
      label: "Kleur buiten",
      type: "select",
      default: "wit",
      options: [
        { id: "wit", label: "Wit (RAL 9010)", hint: "Standaard" },
        { id: "antraciet", label: "Antraciet (RAL 7016)", hint: "+€120" },
        { id: "hout", label: "Houtnerf folie", hint: "+€150" },
        { id: "opaanvraag", label: "Kleur op aanvraag", hint: "+€220" },
      ],
    },
    {
      key: "muur",
      label: "Muuraansluiting",
      type: "select",
      default: "spouw",
      options: [
        { id: "spouw", label: "In spouwmuur", hint: "Standaard" },
        { id: "binnenblad", label: "Op binnenblad", hint: "Extra werk, +€90" },
        { id: "nieuwbouw", label: "Nieuwbouw", hint: "Eenvoudiger, −€40" },
      ],
    },
    {
      key: "ventilatie",
      label: "Ventilatierooster",
      help: "Suskast / zelfregelend rooster boven het glas (+€140).",
      type: "toggle",
      default: false,
    },
    {
      key: "hor",
      label: "Inzethor",
      help: "Vast inzetscherm voor draaikiep-vak (+€180).",
      type: "toggle",
      default: false,
    },
  ],
  estimate: (v) => {
    const wMm = num(v.breedte);
    const hMm = num(v.hoogte);
    const w = wMm / 1000;
    const h = hMm / 1000;
    const area = w * h;
    const materiaal = str(v.materiaal);
    const matPerM2 = opt(materiaal, { hout: 450, kunststof: 380, aluminium: 620, staal: 750 });
    const matLabel =
      { hout: "hout", kunststof: "kunststof", aluminium: "aluminium", staal: "staal" }[materiaal] ?? materiaal;

    const beglazing = str(v.beglazing);
    const beglazingPerM2 = opt(beglazing, { hrpp: 0, triple: 80, matglas: 40, zonwerend: 60 });
    const beglazingLabel =
      { hrpp: "HR++ glas", triple: "Triple glas", matglas: "Matglas", zonwerend: "Zonwerend glas" }[beglazing] ?? "";

    const indeling = opt(str(v.indeling), { enkel: 0, horizontaal: 180, verticaal: 180, vierdelig: 420 });
    const vulling = opt(str(v.vulling), { vast: 0, draaikiep: 220, combi: 280 });
    const vullingLabel = { draaikiep: "Draaikiepfunctie", combi: "Vast + draaikiep" }[str(v.vulling)];

    const dorpelPerM = opt(str(v.dorpel), { geen: 0, kunststeen: 120, hardhout: 180, aluminium: 220 });
    const dorpelLabel = {
      kunststeen: "Kunststeen dorpel",
      hardhout: "Hardhouten dorpel",
      aluminium: "Aluminium dorpel",
    }[str(v.dorpel)];

    const kleurBinnen = opt(str(v.kleurBinnen), { wit: 0, antraciet: 90, hout: 120, opaanvraag: 200 });
    const kleurBuiten = opt(str(v.kleurBuiten), { wit: 0, antraciet: 120, hout: 150, opaanvraag: 220 });
    const muur = opt(str(v.muur), { spouw: 0, binnenblad: 90, nieuwbouw: -40 });

    const lines: EstimateLine[] = [
      {
        label: `Kozijn (${matLabel})`,
        detail: `${wMm}×${hMm} mm = ${area.toFixed(2)} m²`,
        amount: Math.round(matPerM2 * area),
      },
    ];
    if (beglazingPerM2 > 0)
      lines.push({
        label: beglazingLabel,
        detail: `${area.toFixed(2)} m² × € ${beglazingPerM2}/m²`,
        amount: Math.round(beglazingPerM2 * area),
      });
    if (indeling > 0) lines.push({ label: "Indeling (stijlen/dorpels)", amount: indeling });
    if (vulling > 0 && vullingLabel) lines.push({ label: vullingLabel, amount: vulling });
    if (dorpelPerM > 0 && dorpelLabel)
      lines.push({ label: dorpelLabel, detail: `${w.toFixed(2)} m × € ${dorpelPerM}/m`, amount: Math.round(dorpelPerM * w) });
    if (kleurBinnen > 0) lines.push({ label: "Kleur binnen", amount: kleurBinnen });
    if (kleurBuiten > 0) lines.push({ label: "Kleur buiten", amount: kleurBuiten });
    if (muur !== 0)
      lines.push({ label: muur > 0 ? "Muuraansluiting op binnenblad" : "Nieuwbouwkorting muuraansluiting", amount: muur });
    if (v.ventilatie) lines.push({ label: "Ventilatierooster", amount: 140 });
    if (v.hor) lines.push({ label: "Inzethor", amount: 180 });

    let total = lines.reduce((s, l) => s + l.amount, 0);
    if (total < 450 && total > 0) {
      lines.push({ label: "Minimum tarief", amount: 450 - total });
      total = 450;
    }

    const delivery =
      { hout: "± 6 weken", kunststof: "± 4 weken", aluminium: "± 6 weken", staal: "± 8 weken" }[materiaal];
    const notes = delivery ? [`Geschatte richtlevertijd: ${delivery}.`] : undefined;

    return {
      lines,
      total,
      ...band(total, 0.1),
      unitLabel: `${area.toFixed(2)} m² × € ${matPerM2}/m²`,
      notes,
    };
  },
};

export const CALCULATORS: Calculator[] = [
  stucwerk,
  schilderwerk,
  isolatie,
  badkamer,
  vloerverwarming,
  kozijnen,
  opbouwUitbouw,
];

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
