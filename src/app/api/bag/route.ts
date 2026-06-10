import { NextResponse } from "next/server";

// Server-side lookup against the keyless PDOK Locatieserver
// (https://api.pdok.nl/bzk/locatieserver/search/v3_1/free). It only validates
// that the postcode/huisnummer combination exists in BAG — proof enough that
// the property is a bestaande woning, which is what the grants checker needs.

export const runtime = "nodejs";

const PDOK_FREE = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

interface BagPayload {
  postcode?: string;
  huisnummer?: string;
  toevoeging?: string;
}

interface PdokDoc {
  weergavenaam?: string;
  straatnaam?: string;
  huisnummer?: number | string;
  huis_nlt?: string;
  postcode?: string;
  woonplaatsnaam?: string;
  adresseerbaarobject_id?: string;
}

export async function POST(request: Request) {
  let payload: BagPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pc = String(payload.postcode ?? "").replace(/\s+/g, "").toUpperCase();
  const nr = String(payload.huisnummer ?? "").trim();
  const tv = String(payload.toevoeging ?? "").trim().toUpperCase();

  if (!/^\d{4}[A-Z]{2}$/.test(pc) || !/^\d{1,5}$/.test(nr)) {
    return NextResponse.json(
      { error: "Vul een geldige postcode en huisnummer in." },
      { status: 422 },
    );
  }

  const q = `${pc} ${nr}${tv ? ` ${tv}` : ""}`;
  const url = new URL(PDOK_FREE);
  url.searchParams.set("q", q);
  url.searchParams.set("fq", "type:adres");
  url.searchParams.set("rows", "10");
  url.searchParams.set(
    "fl",
    "id,weergavenaam,straatnaam,huisnummer,huis_nlt,postcode,woonplaatsnaam,adresseerbaarobject_id",
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  } catch {
    return NextResponse.json({ error: "Kon PDOK niet bereiken." }, { status: 502 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "PDOK gaf een fout terug." }, { status: 502 });
  }

  const json: { response?: { docs?: PdokDoc[] } } = await res.json();
  const docs = json.response?.docs ?? [];

  const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
  const hit =
    docs.find(
      (d) =>
        norm(d.postcode ?? "") === pc &&
        String(d.huisnummer ?? "") === nr &&
        (!tv || norm(d.huis_nlt ?? "").endsWith(`${nr}${tv}`)),
    ) ?? (tv ? undefined : docs.find((d) => norm(d.postcode ?? "") === pc && String(d.huisnummer ?? "") === nr));

  if (!hit) {
    return NextResponse.json({ error: "Geen adres gevonden. Controleer de invoer." }, { status: 404 });
  }

  return NextResponse.json({
    postcode: pc,
    huisnummer: nr,
    toevoeging: tv || undefined,
    weergavenaam: hit.weergavenaam,
    straat: hit.straatnaam,
    plaats: hit.woonplaatsnaam,
    vboId: hit.adresseerbaarobject_id,
  });
}
