"use client";

import {
  CLADDINGS,
  EXTRA_BOUNDS,
  FRAME_COLORS,
  HEATINGS,
  INTERIORS,
  PRICES,
  ROOFS,
  TERRAS_DEPTH,
} from "@/lib/config";
import { formatEur } from "@/lib/pricing";
import { useConfigurator } from "@/lib/store";
import {
  CounterRow,
  Field,
  OptionCard,
  OptionGrid,
  ToggleRow,
} from "@/components/ui";

export default function StepOptions() {
  const { config, set } = useConfigurator();

  return (
    <div className="space-y-7">
      <Field label="Gevelbekleding">
        <OptionGrid>
          {CLADDINGS.map((c) => (
            <OptionCard
              key={c.id}
              selected={config.cladding === c.id}
              onClick={() => set("cladding", c.id)}
              title={c.name}
              description={c.description}
              swatch={c.color}
              price={c.pricePerM2 ? `+ € ${c.pricePerM2}/m²` : "standaard"}
            />
          ))}
        </OptionGrid>
      </Field>

      <Field label="Dak">
        <OptionGrid>
          {ROOFS.map((r) => (
            <OptionCard
              key={r.id}
              selected={config.roof === r.id}
              onClick={() => set("roof", r.id)}
              title={r.name}
              description={r.description}
              swatch={r.color}
              price={
                r.flatPrice
                  ? `+ ${formatEur(r.flatPrice)}`
                  : r.pricePerM2
                    ? `+ € ${r.pricePerM2}/m²`
                    : "standaard"
              }
            />
          ))}
        </OptionGrid>
      </Field>

      <Field label="Kozijnkleur">
        <OptionGrid>
          {FRAME_COLORS.map((f) => (
            <OptionCard
              key={f.id}
              selected={config.frameColor === f.id}
              onClick={() => set("frameColor", f.id)}
              title={f.name}
              swatch={f.color}
            />
          ))}
        </OptionGrid>
      </Field>

      <Field label="Beglazing">
        <div className="rounded-lg border border-line bg-surface px-4">
          <CounterRow
            label={`Glazen schuifpui (${formatEur(PRICES.schuifpui)})`}
            value={config.schuifpuien}
            bounds={EXTRA_BOUNDS.schuifpuien}
            onChange={(v) => set("schuifpuien", v)}
          />
          <CounterRow
            label={`Vaste ramen (${formatEur(PRICES.raam)})`}
            value={config.ramen}
            bounds={EXTRA_BOUNDS.ramen}
            onChange={(v) => set("ramen", v)}
          />
          <CounterRow
            label={`Dakramen (${formatEur(PRICES.dakraam)})`}
            value={config.dakramen}
            bounds={EXTRA_BOUNDS.dakramen}
            onChange={(v) => set("dakramen", v)}
          />
        </div>
      </Field>

      <Field label="Verwarming">
        <OptionGrid>
          {HEATINGS.map((h) => (
            <OptionCard
              key={h.id}
              selected={config.heating === h.id}
              onClick={() => set("heating", h.id)}
              title={h.name}
              description={h.description}
              price={h.price ? `+ ${formatEur(h.price)}` : "geen kosten"}
            />
          ))}
        </OptionGrid>
      </Field>

      <Field label="Interieurafwerking">
        <OptionGrid>
          {INTERIORS.map((i) => (
            <OptionCard
              key={i.id}
              selected={config.interior === i.id}
              onClick={() => set("interior", i.id)}
              title={i.name}
              description={i.description}
              price={i.pricePerM2 ? `+ € ${i.pricePerM2}/m²` : "standaard"}
            />
          ))}
        </OptionGrid>
      </Field>

      <Field label="Afwerking & extra's">
        <div className="rounded-lg border border-line bg-surface px-4">
          <CounterRow
            label={`Extra stopcontacten (${formatEur(PRICES.stopcontact)} p/st)`}
            value={config.stopcontacten}
            bounds={EXTRA_BOUNDS.stopcontacten}
            onChange={(v) => set("stopcontacten", v)}
          />
          <CounterRow
            label={`Inbouwspots (${formatEur(PRICES.spot)} p/st)`}
            value={config.spots}
            bounds={EXTRA_BOUNDS.spots}
            onChange={(v) => set("spots", v)}
          />
          <ToggleRow
            label="Luifel boven schuifpui"
            description={`Overstek voor schaduw en regenbescherming — ${formatEur(PRICES.luifel)}`}
            checked={config.luifel}
            onChange={(v) => set("luifel", v)}
          />
          <ToggleRow
            label="Houten terras"
            description={`Vlonder aan de voorzijde (${TERRAS_DEPTH} m diep) — ${formatEur(PRICES.terrasPerM2)}/m²`}
            checked={config.terras}
            onChange={(v) => set("terras", v)}
          />
          <ToggleRow
            label="Buitenkraan"
            description={`Vorstvrije buitenkraan — ${formatEur(PRICES.buitenkraan)}`}
            checked={config.buitenkraan}
            onChange={(v) => set("buitenkraan", v)}
          />
          <ToggleRow
            label="Zonwering (screens)"
            description={`Elektrische screens voor de schuifpui — ${formatEur(PRICES.zonwering)}`}
            checked={config.zonwering}
            onChange={(v) => set("zonwering", v)}
          />
        </div>
      </Field>
    </div>
  );
}
