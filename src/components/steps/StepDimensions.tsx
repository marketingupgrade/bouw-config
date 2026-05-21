"use client";

import { motion } from "motion/react";
import { DIMENSIONS, MODELS } from "@/lib/config";
import { computeArea } from "@/lib/pricing";
import { useConfigurator } from "@/lib/store";
import { Field, OptionCard, OptionGrid, Slider } from "@/components/ui";

export default function StepDimensions() {
  const { config, set } = useConfigurator();
  const area = computeArea(config);

  return (
    <div className="space-y-7">
      <Field label="Type aanbouw">
        <OptionGrid>
          {MODELS.map((m) => (
            <OptionCard
              key={m.id}
              selected={config.model === m.id}
              onClick={() => set("model", m.id)}
              title={m.name}
              description={m.description}
              price={`vanaf € ${m.pricePerM2.toLocaleString("nl-NL")}/m²`}
            />
          ))}
        </OptionGrid>
      </Field>

      <Field label="Breedte" hint={`${DIMENSIONS.width.min}–${DIMENSIONS.width.max} m`}>
        <Slider
          value={config.width}
          min={DIMENSIONS.width.min}
          max={DIMENSIONS.width.max}
          step={DIMENSIONS.width.step}
          onChange={(v) => set("width", v)}
        />
      </Field>

      <Field label="Diepte" hint={`${DIMENSIONS.depth.min}–${DIMENSIONS.depth.max} m`}>
        <Slider
          value={config.depth}
          min={DIMENSIONS.depth.min}
          max={DIMENSIONS.depth.max}
          step={DIMENSIONS.depth.step}
          onChange={(v) => set("depth", v)}
        />
      </Field>

      <Field label="Hoogte" hint={`${DIMENSIONS.height.min}–${DIMENSIONS.height.max} m`}>
        <Slider
          value={config.height}
          min={DIMENSIONS.height.min}
          max={DIMENSIONS.height.max}
          step={DIMENSIONS.height.step}
          onChange={(v) => set("height", v)}
        />
      </Field>

      <div className="flex items-center justify-between rounded-lg bg-accent-50 px-4 py-3">
        <span className="text-sm font-medium text-ink-soft">Vloeroppervlak</span>
        <motion.span
          key={area.toFixed(1)}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="text-lg font-semibold text-accent tabular-nums"
        >
          {area.toFixed(1)} m²
        </motion.span>
      </div>
    </div>
  );
}
