import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";

interface MockupPayload {
  photo?: string; // data URL of the source photo
  snapshot?: string; // data URL of the 3D render (compose mode only)
  spec?: string; // text description of the configured proposition
  mode?: "compose" | "edit"; // compose = place a new object; edit = modify the photo in place
}

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "De mockup-functie is nog niet geconfigureerd (GEMINI_API_KEY ontbreekt)." },
      { status: 503 },
    );
  }

  let payload: MockupPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const photo = payload.photo ? splitDataUrl(payload.photo) : null;
  if (!photo) {
    return NextResponse.json({ error: "Upload eerst een foto van de locatie." }, { status: 422 });
  }
  const snapshot = payload.snapshot ? splitDataUrl(payload.snapshot) : null;

  const mode = payload.mode ?? "compose";
  const spec = payload.spec ?? "the proposed work";

  const prompt =
    mode === "edit"
      ? [
          "You are an architectural visualisation assistant.",
          "The user uploaded a real photo of an existing space.",
          `Edit the photo in place to reflect: ${spec}.`,
          "Modify only the elements affected by the change; keep the rest of the photo unchanged",
          "(perspective, lighting direction, framing, background and surrounding architecture).",
          "Match scale, light and shadow so the result looks like a real photograph of the renovated space.",
          "Output only the edited photograph.",
        ].join(" ")
      : [
          "You are an architectural visualisation assistant.",
          "The first image is a real photo of a location where a prefab home extension will be built.",
          snapshot ? "The second image is a 3D render of the exact extension that has been configured." : "",
          `The extension is ${spec}.`,
          "Composite this extension realistically into the location photo: match the perspective,",
          "lighting direction, scale, shadows and ground contact so it looks genuinely built on site.",
          "Place it in the most natural position (attached to the house or in the open space).",
          "Keep the rest of the photo unchanged and photorealistic. Output only the edited photograph.",
        ]
          .filter(Boolean)
          .join(" ");

  const parts: Record<string, unknown>[] = [
    { text: prompt },
    { inlineData: { mimeType: photo.mimeType, data: photo.data } },
  ];
  if (snapshot) {
    parts.push({ inlineData: { mimeType: snapshot.mimeType, data: snapshot.data } });
  }

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      },
    );
  } catch {
    return NextResponse.json({ error: "Kon de AI-service niet bereiken." }, { status: 502 });
  }

  if (!res.ok) {
    const detail = await res.text();
    console.error("[mockup] gemini error", res.status, detail.slice(0, 500));
    return NextResponse.json(
      { error: "De AI-service gaf een fout terug. Probeer het opnieuw." },
      { status: 502 },
    );
  }

  const json = await res.json();
  const responseParts: Array<{ inlineData?: { mimeType: string; data: string } }> =
    json?.candidates?.[0]?.content?.parts ?? [];
  const image = responseParts.find((p) => p.inlineData)?.inlineData;

  if (!image) {
    return NextResponse.json(
      { error: "De AI gaf geen afbeelding terug. Probeer een andere foto." },
      { status: 502 },
    );
  }

  return NextResponse.json({ image: `data:${image.mimeType};base64,${image.data}` });
}
