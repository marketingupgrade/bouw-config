import {
  CLADDINGS,
  FRAME_COLORS,
  HEATINGS,
  INTERIORS,
  MODELS,
  PRICES,
  ROOFS,
  TERRAS_DEPTH,
  type Configuration,
} from "./config";

export interface PriceLine {
  label: string;
  detail?: string;
  amount: number;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  subtotal: number;
  vat: number;
  total: number;
  area: number;
}

const VAT_RATE = 0.21;

const byId = <T extends { id: string }>(items: T[], id: string): T =>
  items.find((item) => item.id === id) ?? items[0];

export function computeArea(config: Configuration): number {
  return config.width * config.depth;
}

/** Approximate facade area: perimeter × height, minus a rough glazing allowance. */
function facadeArea(config: Configuration): number {
  const perimeter = 2 * (config.width + config.depth);
  const gross = perimeter * config.height;
  const glazing = config.schuifpuien * 6; // ~6 m² per sliding-door set
  return Math.max(gross - glazing, 0);
}

export function computePrice(config: Configuration): PriceBreakdown {
  const area = computeArea(config);
  const roofArea = area;
  const facade = facadeArea(config);

  const model = byId(MODELS, config.model);
  const cladding = byId(CLADDINGS, config.cladding);
  const roof = byId(ROOFS, config.roof);
  const heating = byId(HEATINGS, config.heating);
  const interior = byId(INTERIORS, config.interior);

  const lines: PriceLine[] = [];

  lines.push({
    label: `${model.name} (basisconstructie)`,
    detail: `${area.toFixed(1)} m² × € ${model.pricePerM2.toLocaleString("nl-NL")}/m²`,
    amount: Math.round(area * model.pricePerM2),
  });

  if (cladding.pricePerM2 > 0) {
    lines.push({
      label: `Gevelbekleding: ${cladding.name}`,
      detail: `${facade.toFixed(1)} m² × € ${cladding.pricePerM2}/m²`,
      amount: Math.round(facade * cladding.pricePerM2),
    });
  }

  if (roof.flatPrice > 0 || roof.pricePerM2 > 0) {
    lines.push({
      label: `Dak: ${roof.name}`,
      detail:
        roof.pricePerM2 > 0
          ? `${roofArea.toFixed(1)} m² × € ${roof.pricePerM2}/m²`
          : undefined,
      amount: Math.round(roof.flatPrice + roofArea * roof.pricePerM2),
    });
  }

  if (config.schuifpuien > 0) {
    lines.push({
      label: "Glazen schuifpui",
      detail: `${config.schuifpuien} × € ${PRICES.schuifpui.toLocaleString("nl-NL")}`,
      amount: config.schuifpuien * PRICES.schuifpui,
    });
  }

  if (config.ramen > 0) {
    lines.push({
      label: "Vaste ramen",
      detail: `${config.ramen} × € ${PRICES.raam.toLocaleString("nl-NL")}`,
      amount: config.ramen * PRICES.raam,
    });
  }

  if (config.dakramen > 0) {
    lines.push({
      label: "Dakramen",
      detail: `${config.dakramen} × € ${PRICES.dakraam.toLocaleString("nl-NL")}`,
      amount: config.dakramen * PRICES.dakraam,
    });
  }

  if (config.luifel) {
    lines.push({ label: "Luifel boven schuifpui", amount: PRICES.luifel });
  }

  if (config.terras) {
    const terrasArea = config.width * TERRAS_DEPTH;
    lines.push({
      label: "Houten terras",
      detail: `${terrasArea.toFixed(1)} m² × € ${PRICES.terrasPerM2}/m²`,
      amount: Math.round(terrasArea * PRICES.terrasPerM2),
    });
  }

  if (heating.price > 0) {
    lines.push({ label: heating.name, amount: heating.price });
  }

  if (interior.pricePerM2 > 0) {
    lines.push({
      label: `Interieur: ${interior.name}`,
      detail: `${area.toFixed(1)} m² × € ${interior.pricePerM2}/m²`,
      amount: Math.round(area * interior.pricePerM2),
    });
  }

  if (config.stopcontacten > 0) {
    lines.push({
      label: "Extra stopcontacten",
      detail: `${config.stopcontacten} × € ${PRICES.stopcontact}`,
      amount: config.stopcontacten * PRICES.stopcontact,
    });
  }

  if (config.spots > 0) {
    lines.push({
      label: "Inbouwspots",
      detail: `${config.spots} × € ${PRICES.spot}`,
      amount: config.spots * PRICES.spot,
    });
  }

  if (config.buitenkraan) {
    lines.push({ label: "Buitenkraan", amount: PRICES.buitenkraan });
  }

  if (config.zonwering) {
    lines.push({ label: "Zonwering (screens)", amount: PRICES.zonwering });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const vat = Math.round(subtotal * VAT_RATE);

  return { lines, subtotal, vat, total: subtotal + vat, area };
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Plain-language description of the configured extension, for the AI mockup prompt. */
export function describeConfiguration(config: Configuration): string {
  const model = byId(MODELS, config.model);
  const cladding = byId(CLADDINGS, config.cladding);
  const roof = byId(ROOFS, config.roof);
  const frame = byId(FRAME_COLORS, config.frameColor);

  const parts = [
    `a modern prefab home extension (${model.name.toLowerCase()})`,
    `${config.width.toFixed(1)} m wide, ${config.depth.toFixed(1)} m deep and ${config.height.toFixed(1)} m high`,
    `with ${cladding.name} facade cladding`,
    `a ${roof.name.toLowerCase()}`,
    `${frame.name.toLowerCase()} window frames`,
  ];
  if (config.schuifpuien > 0)
    parts.push(`${config.schuifpuien} large glazed sliding door(s) across the front`);
  if (config.ramen > 0) parts.push(`${config.ramen} fixed window(s)`);
  if (config.dakramen > 0) parts.push(`${config.dakramen} roof skylight(s)`);
  if (config.luifel) parts.push("a canopy over the sliding doors");
  if (config.terras) parts.push("an adjoining wooden deck");

  return parts.join(", ") + ".";
}
