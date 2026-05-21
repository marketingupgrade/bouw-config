import Link from "next/link";
import { CALCULATORS } from "@/lib/calculators";

export const metadata = {
  title: "Calculators & configurator | Bureau Wijnschenk",
  description:
    "Bereken eenvoudig een richtprijs voor stucwerk, schilderwerk, isolatie, opbouw en uitbouw — of stel je prefab aanbouw samen in 3D.",
};

interface Tool {
  href: string;
  title: string;
  tagline: string;
  accent: string;
  badge?: string;
}

const featured: Tool = {
  href: "/aanbouw",
  title: "Aanbouw op maat — 3D-configurator",
  tagline:
    "Stel je prefab aanbouw samen, bekijk hem live in 3D en zie hem met AI op een foto van je eigen locatie.",
  accent: "#3f6f3f",
  badge: "3D + AI",
};

const tools: Tool[] = CALCULATORS.map((c) => ({
  href: `/calculator/${c.slug}`,
  title: c.title,
  tagline: c.tagline,
  accent: c.accent,
}));

function ToolCard({ tool, large = false }: { tool: Tool; large?: boolean }) {
  return (
    <Link
      href={tool.href}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${
        large ? "sm:col-span-2" : ""
      }`}
    >
      <span
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: tool.accent }}
        aria-hidden
      />
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className={`font-bold text-ink ${large ? "text-xl" : "text-lg"}`}>{tool.title}</h2>
          {tool.badge && (
            <span className="shrink-0 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent">
              {tool.badge}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{tool.tagline}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        Bereken richtprijs
        <span className="transition group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-5 lg:px-8">
        <span className="text-base font-semibold uppercase tracking-[0.18em] text-accent">
          Bureau Wijnschenk
        </span>
        <a href="#" className="hidden text-sm font-medium text-muted hover:text-accent sm:inline">
          Hulp nodig?
        </a>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 lg:px-8 lg:py-16">
        <p className="eyebrow">Online offerte</p>
        <h1 className="mt-1 max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Bereken in een minuut wat jouw klus kost
        </h1>
        <p className="mt-3 max-w-prose text-base text-muted">
          Kies een calculator, vul een paar gegevens in en ontvang direct een
          indicatieve richtprijs. Daarna vraag je vrijblijvend een offerte op maat aan.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ToolCard tool={featured} large />
          {tools.map((t) => (
            <ToolCard key={t.href} tool={t} />
          ))}
        </div>
      </main>

      <footer className="border-t border-line bg-surface px-5 py-6 text-center text-xs text-muted lg:px-8">
        Richtprijzen zijn indicatief. Aan deze calculators kunnen geen rechten worden ontleend.
      </footer>
    </div>
  );
}
