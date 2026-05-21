import { NextResponse } from "next/server";
import { getCalculator } from "@/lib/calculators";

interface LeadPayload {
  calculator?: string;
  values?: Record<string, unknown>;
  estimate?: number;
  contact?: Record<string, unknown>;
  url?: string;
}

export async function POST(request: Request) {
  let payload: LeadPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(payload.contact?.name ?? "").trim();
  const email = String(payload.contact?.email ?? "").trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Naam en een geldig e-mailadres zijn verplicht." },
      { status: 422 },
    );
  }

  const calc = payload.calculator ? getCalculator(payload.calculator) : undefined;
  if (!calc) {
    return NextResponse.json({ error: "Onbekende calculator." }, { status: 422 });
  }

  // No CRM/email backend was requested — record the lead in the server log.
  // Swap this for an email/CRM integration when credentials are available.
  console.info("[lead] new calculator lead", {
    calculator: calc.slug,
    name,
    email,
    phone: payload.contact?.phone,
    postcode: payload.contact?.postcode,
    estimate: payload.estimate,
    url: payload.url,
    values: payload.values,
  });

  return NextResponse.json({ ok: true });
}
