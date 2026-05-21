import { NextResponse } from "next/server";

interface WishlistLeadPayload {
  contact?: Record<string, unknown>;
  items?: Array<{ title?: string; amount?: number; url?: string }>;
  total?: number;
}

export async function POST(request: Request) {
  let payload: WishlistLeadPayload;
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

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "De wenslijst is leeg." }, { status: 422 });
  }

  // No CRM/email backend was requested — record the combined lead in the log.
  console.info("[wishlist] combined offer request", {
    name,
    email,
    phone: payload.contact?.phone,
    postcode: payload.contact?.postcode,
    total: payload.total,
    items: payload.items.map((i) => ({ title: i.title, amount: i.amount, url: i.url })),
  });

  return NextResponse.json({ ok: true });
}
