// Domain model for the prefab extension ("aanbouw") configurator.
// Prices are in EUR. Labels are in Dutch to match the product.

export type ModelId = "tuinkamer" | "bijgebouw" | "gastenverblijf";
export type CladdingId = "cedar" | "thermo" | "trespa" | "stucwerk";
export type RoofId = "epdm" | "sedum" | "lessenaar";
export type HeatingId = "geen" | "vloer" | "cv";
export type InteriorId = "casco" | "standaard" | "luxe";

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  /** Base construction price per m² of floor area. */
  pricePerM2: number;
}

export interface CladdingOption {
  id: CladdingId;
  name: string;
  description: string;
  /** Surcharge per m² of facade area (relative to the cheapest option). */
  pricePerM2: number;
  /** Base colour used in the 3D preview. */
  color: string;
  roughness: number;
}

export interface RoofOption {
  id: RoofId;
  name: string;
  description: string;
  /** Flat surcharge added regardless of size. */
  flatPrice: number;
  /** Extra surcharge per m² of roof area. */
  pricePerM2: number;
  color: string;
}

export interface HeatingOption {
  id: HeatingId;
  name: string;
  description: string;
  price: number;
}

export interface InteriorOption {
  id: InteriorId;
  name: string;
  description: string;
  pricePerM2: number;
}

export const MODELS: ModelOption[] = [
  {
    id: "tuinkamer",
    name: "Tuinkamer",
    description: "Lichte aanbouw aan de woning, volledig op maat.",
    pricePerM2: 3900,
  },
  {
    id: "bijgebouw",
    name: "Bijgebouw",
    description: "Vrijstaand bijgebouw als kantoor, studio of berging.",
    pricePerM2: 3700,
  },
  {
    id: "gastenverblijf",
    name: "Gastenverblijf",
    description: "Vrijstaand verblijf met voorbereiding voor badkamer.",
    pricePerM2: 4500,
  },
];

export const CLADDINGS: CladdingOption[] = [
  {
    id: "cedar",
    name: "Western Red Cedar",
    description: "Natuurlijk verduurzaamd hout, warme uitstraling.",
    pricePerM2: 0,
    color: "#9c6b3f",
    roughness: 0.85,
  },
  {
    id: "thermo",
    name: "Thermisch essen",
    description: "Donker geborsteld hout, strak en duurzaam.",
    pricePerM2: 35,
    color: "#5b4636",
    roughness: 0.8,
  },
  {
    id: "trespa",
    name: "Trespa plaat antraciet",
    description: "Onderhoudsarme gevelplaat, moderne look.",
    pricePerM2: 55,
    color: "#3a3d40",
    roughness: 0.5,
  },
  {
    id: "stucwerk",
    name: "Stucwerk wit",
    description: "Gladde gestucte gevel, tijdloos wit.",
    pricePerM2: 45,
    color: "#ece9e2",
    roughness: 0.95,
  },
];

export const ROOFS: RoofOption[] = [
  {
    id: "epdm",
    name: "Plat dak (EPDM)",
    description: "Standaard plat dak met EPDM-bedekking.",
    flatPrice: 0,
    pricePerM2: 0,
    color: "#2b2b2b",
  },
  {
    id: "sedum",
    name: "Sedum daktuin",
    description: "Groendak met sedumbeplanting, isolerend.",
    flatPrice: 0,
    pricePerM2: 90,
    color: "#4f7a3a",
  },
  {
    id: "lessenaar",
    name: "Lessenaarsdak",
    description: "Schuin aflopend dak voor extra lichtinval.",
    flatPrice: 2500,
    pricePerM2: 0,
    color: "#1f1f1f",
  },
];

export const HEATINGS: HeatingOption[] = [
  { id: "geen", name: "Geen verwarming", description: "Casco zonder verwarming.", price: 0 },
  {
    id: "vloer",
    name: "Elektrische vloerverwarming",
    description: "Comfortabele vloerverwarming, eenvoudig te regelen.",
    price: 1800,
  },
  {
    id: "cv",
    name: "CV-aansluiting + radiator",
    description: "Aansluiting op bestaande CV met radiator.",
    price: 2400,
  },
];

export const INTERIORS: InteriorOption[] = [
  { id: "casco", name: "Casco", description: "Wind- en waterdicht, zelf afwerken.", pricePerM2: 0 },
  {
    id: "standaard",
    name: "Standaard afwerking",
    description: "Gestucte wanden, plafond en vloer afgewerkt.",
    pricePerM2: 180,
  },
  {
    id: "luxe",
    name: "Luxe afwerking",
    description: "Hoogwaardige materialen en afwerkingsdetails.",
    pricePerM2: 320,
  },
];

// Unit prices for openings and finishing extras.
export const PRICES = {
  schuifpui: 3200, // per glazed sliding-door set (schuifpui)
  raam: 650, // per fixed window
  stopcontact: 55, // per extra socket
  spot: 75, // per recessed ceiling spot
  buitenkraan: 220,
  zonwering: 1400, // screens (one-off package)
} as const;

// Dimension bounds (metres).
export const DIMENSIONS = {
  width: { min: 2.5, max: 8, step: 0.1, default: 4 },
  depth: { min: 2, max: 6, step: 0.1, default: 3 },
  height: { min: 2.6, max: 3.2, step: 0.1, default: 2.8 },
} as const;

export const EXTRA_BOUNDS = {
  schuifpuien: { min: 0, max: 3 },
  ramen: { min: 0, max: 6 },
  stopcontacten: { min: 0, max: 12 },
  spots: { min: 0, max: 16 },
} as const;

export interface Configuration {
  model: ModelId;
  width: number;
  depth: number;
  height: number;
  cladding: CladdingId;
  roof: RoofId;
  heating: HeatingId;
  interior: InteriorId;
  schuifpuien: number;
  ramen: number;
  stopcontacten: number;
  spots: number;
  buitenkraan: boolean;
  zonwering: boolean;
}

export const DEFAULT_CONFIG: Configuration = {
  model: "tuinkamer",
  width: DIMENSIONS.width.default,
  depth: DIMENSIONS.depth.default,
  height: DIMENSIONS.height.default,
  cladding: "cedar",
  roof: "epdm",
  heating: "vloer",
  interior: "standaard",
  schuifpuien: 1,
  ramen: 1,
  stopcontacten: 4,
  spots: 6,
  buitenkraan: false,
  zonwering: false,
};
