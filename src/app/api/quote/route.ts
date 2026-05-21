import { NextResponse } from "next/server";
import { DEFAULT_CONFIG, type Configuration } from "@/lib/config";
import { computePrice } from "@/lib/pricing";

interface QuotePayload {
  contact?: Record<string, unknown>;
  config?: Partial<Configuration>;
  url?: string;
}

function sanitizeConfig(input: Partial<Configuration> | undefined): Configuration {
  // Merge with defaults so the price is always recomputed server-side
  // from a complete, trusted shape rather than the client-sent total.
  return { ...DEFAULT_CONFIG, ...(input ?? {}) };
}

export async function POST(request: Request) {
  let payload: QuotePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(payload.contact?.email ?? "").trim();
  const name = String(payload.contact?.name ?? "").trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Naam en een geldig e-mailadres zijn verplicht." },
      { status: 422 },
    );
  }

  const config = sanitizeConfig(payload.config);
  const price = computePrice(config);

  // No CRM/email backend was requested — record the lead in the server log.
  // Swap this for an email/CRM integration when credentials are available.
  console.info("[quote] new lead", {
    name,
    email,
    phone: payload.contact?.phone,
    postcode: payload.contact?.postcode,
    total: price.total,
    url: payload.url,
    config,
  });

  return NextResponse.json({ ok: true, total: price.total });
}
