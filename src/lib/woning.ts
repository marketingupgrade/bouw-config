import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WoningInfo {
  postcode: string;
  huisnummer: string;
  toevoeging?: string;
  weergavenaam: string; // full address
  straat: string;
  plaats: string;
  vboId?: string; // BAG verblijfsobject id (for future enrichment)
}

interface WoningState {
  woning?: WoningInfo;
  set: (w?: WoningInfo) => void;
  clear: () => void;
}

export const useWoning = create<WoningState>()(
  persist(
    (set) => ({
      woning: undefined,
      set: (w) => set({ woning: w }),
      clear: () => set({ woning: undefined }),
    }),
    { name: "bw-woning" },
  ),
);
