# Aanbouw Configurator

A 3-step web configurator for prefab home extensions ("aanbouw"), inspired by
deprefabriek.nl/configurator. Users set dimensions, choose options, and get a
live richtprijs with a quote-request form.

- **Step 1 – Afmetingen:** type of extension + width/depth/height sliders.
- **Step 2 – Opties:** cladding, roof, glazing, heating, interior finish, extras.
- **Step 3 – Offerte:** configuration summary, price breakdown, lead form.

A real-time 3D preview (react-three-fiber) reflects the chosen dimensions,
cladding, roof type and glazing as you configure.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
react-three-fiber / drei · zustand.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Theming

All brand colors and fonts live as tokens in `src/app/globals.css` (`@theme`
block). Edit those values to match a brand identity — every component reads
from them.

## Pricing & domain

- `src/lib/config.ts` – options, prices, dimension bounds, default config.
- `src/lib/pricing.ts` – pricing engine and price breakdown.
- `src/app/api/quote/route.ts` – lead endpoint; recomputes the price
  server-side and logs the lead. Swap the `console.info` for an email/CRM
  integration when credentials are available.
