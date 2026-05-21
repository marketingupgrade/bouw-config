import { create } from "zustand";
import { DEFAULT_CONFIG, type Configuration } from "./config";

export const STEPS = ["Afmetingen", "Opties", "Offerte"] as const;
export type StepIndex = 0 | 1 | 2;

interface ConfiguratorState {
  config: Configuration;
  step: StepIndex;
  set: <K extends keyof Configuration>(key: K, value: Configuration[K]) => void;
  load: (config: Configuration) => void;
  goTo: (step: StepIndex) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export const useConfigurator = create<ConfiguratorState>((set) => ({
  config: DEFAULT_CONFIG,
  step: 0,
  set: (key, value) =>
    set((state) => ({ config: { ...state.config, [key]: value } })),
  load: (config) => set({ config }),
  goTo: (step) => set({ step }),
  next: () =>
    set((state) => ({ step: Math.min(state.step + 1, 2) as StepIndex })),
  prev: () =>
    set((state) => ({ step: Math.max(state.step - 1, 0) as StepIndex })),
  reset: () => set({ config: DEFAULT_CONFIG, step: 0 }),
}));
