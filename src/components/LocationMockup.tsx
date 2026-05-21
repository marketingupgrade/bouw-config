"use client";

import { useRef, useState } from "react";
import { describeConfiguration } from "@/lib/pricing";
import { useConfigurator } from "@/lib/store";

type Status = "idle" | "busy" | "error";

// Downscale an uploaded image so the payload stays small and generation is fast.
function downscale(file: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no 2d context"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function snapshot3D(): string | null {
  const canvas = document.querySelector("canvas");
  try {
    return canvas ? canvas.toDataURL("image/png") : null;
  } catch {
    return null;
  }
}

export default function LocationMockup() {
  const config = useConfigurator((s) => s.config);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError("");
    try {
      setPhoto(await downscale(file));
    } catch {
      setError("Kon de foto niet inladen.");
    }
  }

  async function generate() {
    if (!photo) return;
    setStatus("busy");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo,
          snapshot: snapshot3D(),
          spec: describeConfiguration(config),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Er ging iets mis.");
        return;
      }
      setResult(data.image);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Kon de mockup niet genereren.");
    }
  }

  const btn =
    "rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 lg:p-7">
      <h2 className="text-lg font-bold text-ink">Zie het op jouw locatie</h2>
      <p className="mt-1 text-sm text-muted">
        Upload een foto van je tuin of gevel. Onze AI plaatst je samengestelde
        aanbouw realistisch in de foto als mockup.
      </p>

      <div className="mt-5 grid flex-1 grid-rows-[auto] gap-4 sm:grid-cols-2">
        {/* Source photo */}
        <div className="flex flex-col">
          <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Jouw foto
          </span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-page text-center transition hover:border-accent"
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Locatie" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-sm text-muted">
                Klik om een foto te uploaden
                <br />
                <span className="text-xs">(JPG of PNG)</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFile}
            className="hidden"
          />
        </div>

        {/* Result */}
        <div className="flex flex-col">
          <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Mockup
          </span>
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-page text-center">
            {status === "busy" && (
              <span className="animate-pulse px-4 text-sm text-muted">
                Mockup genereren…
                <br />
                <span className="text-xs">dit kan ~10–20 sec. duren</span>
              </span>
            )}
            {status !== "busy" && result && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result} alt="AI-mockup" className="h-full w-full object-cover" />
            )}
            {status !== "busy" && !result && (
              <span className="px-4 text-sm text-muted">
                Je mockup verschijnt hier
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-accent-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={!photo || status === "busy"}
          className={`${btn} bg-accent text-white hover:bg-accent-600`}
        >
          {result ? "Opnieuw genereren" : "Genereer mockup"}
        </button>
        {result && (
          <a
            href={result}
            download="aanbouw-mockup.png"
            className={`${btn} border border-line text-ink-soft hover:border-ink-soft`}
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}
