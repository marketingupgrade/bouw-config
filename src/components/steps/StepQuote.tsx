"use client";

import { useState } from "react";
import { CLADDINGS, FRAME_COLORS, HEATINGS, INTERIORS, MODELS, ROOFS } from "@/lib/config";
import { computePrice, formatEur } from "@/lib/pricing";
import { useConfigurator } from "@/lib/store";

const name = <T extends { id: string; name: string }>(items: T[], id: string) =>
  items.find((i) => i.id === id)?.name ?? "—";

function Summary() {
  const config = useConfigurator((s) => s.config);
  const rows: [string, string][] = [
    ["Type", name(MODELS, config.model)],
    ["Afmetingen", `${config.width.toFixed(1)} × ${config.depth.toFixed(1)} × ${config.height.toFixed(1)} m`],
    ["Gevelbekleding", name(CLADDINGS, config.cladding)],
    ["Dak", name(ROOFS, config.roof)],
    ["Kozijnkleur", name(FRAME_COLORS, config.frameColor)],
    ["Beglazing", `${config.schuifpuien} schuifpui · ${config.ramen} ramen · ${config.dakramen} dakramen`],
    ["Verwarming", name(HEATINGS, config.heating)],
    ["Interieur", name(INTERIORS, config.interior)],
    [
      "Extra's",
      [
        `${config.stopcontacten} stopcontacten`,
        `${config.spots} spots`,
        config.luifel ? "luifel" : "",
        config.terras ? "terras" : "",
        config.buitenkraan ? "buitenkraan" : "",
        config.zonwering ? "zonwering" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ],
  ];
  return (
    <dl className="divide-y divide-line rounded-lg border border-line bg-surface">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-sm text-muted">{k}</dt>
          <dd className="text-right text-sm font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Breakdown() {
  const config = useConfigurator((s) => s.config);
  const price = computePrice(config);
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <ul className="space-y-2">
        {price.lines.map((line, i) => (
          <li key={i} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink-soft">
              {line.label}
              {line.detail && <span className="ml-1 text-xs text-muted">({line.detail})</span>}
            </span>
            <span className="shrink-0 tabular-nums text-ink">{formatEur(line.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotaal (excl. btw)</span>
          <span className="tabular-nums">{formatEur(price.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Btw 21%</span>
          <span className="tabular-nums">{formatEur(price.vat)}</span>
        </div>
        <div className="flex justify-between pt-1 text-base font-semibold text-ink">
          <span>Totaal (incl. btw)</span>
          <span className="tabular-nums text-accent">{formatEur(price.total)}</span>
        </div>
      </div>
    </div>
  );
}

type Status = "idle" | "sending" | "done" | "error";

function LeadForm() {
  const config = useConfigurator((s) => s.config);
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const contact = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, config }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-accent bg-accent-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-ink">Bedankt voor je aanvraag!</h3>
        <p className="mt-2 text-sm text-ink-soft">
          We hebben je configuratie en richtprijs ontvangen en nemen binnen één
          werkdag contact met je op voor een vrijblijvende offerte.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Naam" className={inputClass} />
        <input name="email" type="email" required placeholder="E-mailadres" className={inputClass} />
        <input name="phone" placeholder="Telefoonnummer" className={inputClass} />
        <input name="postcode" placeholder="Postcode" className={inputClass} />
      </div>
      <textarea
        name="message"
        rows={3}
        placeholder="Eventuele toelichting of vragen"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
      >
        {status === "sending" ? "Versturen…" : "Vraag vrijblijvend offerte aan"}
      </button>
      {status === "error" && (
        <p className="text-center text-sm text-accent-600">
          Er ging iets mis. Probeer het opnieuw of bel ons.
        </p>
      )}
      <p className="text-center text-xs text-muted">
        Dit is een indicatieve richtprijs. Aan deze configurator kunnen geen
        rechten worden ontleend.
      </p>
    </form>
  );
}

export default function StepQuote() {
  return (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Jouw configuratie</h3>
        <Summary />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Prijsopbouw</h3>
        <Breakdown />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Offerte aanvragen</h3>
        <LeadForm />
      </div>
    </div>
  );
}
