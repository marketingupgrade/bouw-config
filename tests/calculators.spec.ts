import { test, expect } from "@playwright/test";

test("hub lists tools and a calculator estimates + submits", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Bereken in een minuut/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /3D-configurator/ })).toBeVisible();
  await page.screenshot({ path: "test-results/hub.png", fullPage: true });

  // Open the stucwerk calculator.
  await page.getByRole("heading", { name: "Stucwerk", exact: true }).click();
  await expect(page).toHaveURL(/calculator\/stucwerk/);
  await expect(page.getByText(/Geschatte richtprijs/)).toBeVisible();

  // Change area and confirm the estimate is non-empty / updates.
  const before = await page.getByText(/Geschatte richtprijs/).locator("..").innerText();
  await page.getByRole("button", { name: /Plafond/ }).click();
  const after = await page.getByText(/Geschatte richtprijs/).locator("..").innerText();
  expect(after).not.toEqual(before);
  await page.screenshot({ path: "test-results/calc-stucwerk.png", fullPage: true });

  // Submit the lead form.
  await page.getByPlaceholder("Naam").fill("Test Klant");
  await page.getByPlaceholder("E-mailadres").fill("test@example.nl");
  await page.getByRole("button", { name: /Vraag vrijblijvend offerte aan/ }).click();
  await expect(page.getByText("Bedankt voor je aanvraag!")).toBeVisible({ timeout: 10_000 });
});

test("isolatie shows subsidy deduction", async ({ page }) => {
  await page.goto("/calculator/isolatie");
  await expect(page.getByText(/ISDE-subsidie/).first()).toBeVisible();
});

test("calculator state is shareable and resumable via the URL", async ({ page }) => {
  await page.goto("/calculator/stucwerk");
  await page.getByRole("button", { name: /Plafond/ }).click();
  await page.getByRole("button", { name: /Sierpleister/ }).click();
  await expect(page).toHaveURL(/onderdeel=plafond/);
  await expect(page).toHaveURL(/afwerking=sierpleister/);

  const shared = page.url();
  await page.goto(shared);
  await expect(page.getByRole("button", { name: /Plafond/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Sierpleister/ })).toHaveAttribute("aria-pressed", "true");
});

test("configurator state round-trips through a shared link", async ({ page }) => {
  await page.goto("/aanbouw?model=gastenverblijf&cladding=trespa&terras=1");
  await expect(page.getByRole("button", { name: /Gastenverblijf/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Volgende stap" }).click();
  await expect(page.getByRole("button", { name: /Trespa plaat antraciet/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("switch", { name: /Houten terras/ })).toHaveAttribute("aria-checked", "true");
});

test("isolatie grants checker turns positive when ISDE criteria are met", async ({ page }) => {
  await page.goto("/calculator/isolatie");
  await expect(page.getByText(/Voldoe aan alle voorwaarden/)).toBeVisible();
  await page.getByRole("switch", { name: /Eigenaar én bewoner/ }).click();
  await page.getByRole("switch", { name: /Bestaande woning/ }).click();
  await expect(page.getByText(/Je komt waarschijnlijk in aanmerking/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Bron: RVO/ })).toHaveAttribute("href", /rvo\.nl/);
});

test("wishlist collects propositions and requests a combined offer", async ({ page }) => {
  await page.goto("/calculator/stucwerk");
  await page.getByRole("button", { name: /Voeg toe aan wenslijst/ }).click();
  await expect(page.getByRole("button", { name: /In wenslijst/ })).toBeVisible();

  // Add a second, different proposition; the persisted list carries over.
  await page.goto("/calculator/isolatie");
  await page.getByRole("button", { name: /Voeg toe aan wenslijst/ }).click();

  await page.getByRole("button", { name: /Wenslijst/ }).click();
  const drawer = page.getByTestId("wishlist-drawer");
  await expect(drawer).toBeVisible();
  await drawer.getByPlaceholder("Naam").fill("Comb Klant");
  await drawer.getByPlaceholder("E-mailadres").fill("comb@example.nl");
  await drawer.getByRole("button", { name: "Vraag offerte aan" }).click();
  await expect(page.getByText("Bedankt voor je aanvraag!")).toBeVisible({ timeout: 10_000 });
});

test("HR++/triple glass are ISDE measures with the correct requirement", async ({ page }) => {
  await page.goto("/calculator/isolatie");
  await page.getByRole("button", { name: /Triple glas/ }).click();
  await page.getByRole("switch", { name: /Eigenaar én bewoner/ }).click();
  await page.getByRole("switch", { name: /Bestaande woning/ }).click();
  await expect(page.getByText(/Je komt waarschijnlijk in aanmerking/)).toBeVisible();
  await expect(page.getByText(/U-waarde ≤ 0,7/)).toBeVisible();
});

test("two insulation measures in the wishlist auto-apply the higher ISDE rate", async ({ page }) => {
  await page.goto("/calculator/isolatie"); // default: spouwmuur
  await page.getByRole("button", { name: /Voeg toe aan wenslijst/ }).click();
  // Switch the current calculation to a different measure -> 2 distinct measures.
  await page.getByRole("button", { name: "Vloerisolatie" }).click();
  await expect(page.getByText(/Automatisch aan/)).toBeVisible();
  await page.getByRole("switch", { name: /Eigenaar én bewoner/ }).click();
  await page.getByRole("switch", { name: /Bestaande woning/ }).click();
  // Vloer doubled rate is €14/m²; the higher-rate label must show.
  await expect(page.getByText(/verhoogd tarief bij 2\+ maatregelen/i)).toBeVisible();
});

test("badkamer module estimates and offers no national subsidy", async ({ page }) => {
  await page.goto("/calculator/badkamer");
  await expect(page.getByRole("heading", { name: "Badkamer", level: 1 })).toBeVisible();
  await expect(page.getByText(/Geschatte richtprijs/)).toBeVisible();
  // Adding a ligbad must raise the estimate.
  const before = await page.getByText(/Geschatte richtprijs/).locator("..").innerText();
  await page.getByRole("switch", { name: /Ligbad/ }).click();
  const after = await page.getByText(/Geschatte richtprijs/).locator("..").innerText();
  expect(after).not.toEqual(before);
  // German-style washing machine + dryer setup adds a line.
  await page.getByRole("button", { name: /Wasmachine \+ droger/ }).click();
  await expect(page.getByText(/Wasmachine \+ droger \(incl\. kast\)/)).toBeVisible();
  // Bathrooms have no national grant.
  await expect(page.getByText(/geen landelijke subsidie/i)).toBeVisible();
});

test("vloerverwarming module estimates and reacts to system choice", async ({ page }) => {
  await page.goto("/calculator/vloerverwarming");
  await expect(page.getByRole("heading", { name: "Vloerverwarming", level: 1 })).toBeVisible();
  const before = await page.getByText(/Geschatte richtprijs/).locator("..").innerText();
  await page.getByRole("button", { name: /Elektrisch/ }).click();
  const after = await page.getByText(/Geschatte richtprijs/).locator("..").innerText();
  expect(after).not.toEqual(before);
});

test("vloerverwarming with vloerisolatie unlocks the ISDE grants check", async ({ page }) => {
  await page.goto("/calculator/vloerverwarming");
  // No insulation yet -> no national scheme.
  await expect(page.getByText(/geen landelijke subsidie/i)).toBeVisible();
  // Add floor insulation -> ISDE check appears (default 40 m² ≥ 20 m² minimum).
  await page.getByRole("switch", { name: /Vloerisolatie toevoegen/ }).click();
  await expect(page.getByText(/Subsidiecheck — ISDE/)).toBeVisible();
  await page.getByRole("switch", { name: /Eigenaar én bewoner/ }).click();
  await page.getByRole("switch", { name: /Bestaande woning/ }).click();
  await expect(page.getByText(/Je komt waarschijnlijk in aanmerking/)).toBeVisible();
});

test("lead api rejects invalid email", async ({ page }) => {
  const res = await page.request.post("/api/lead", {
    data: { calculator: "stucwerk", contact: { name: "X", email: "nope" } },
  });
  expect(res.status()).toBe(422);
});

test("wishlist api rejects empty or unauthenticated requests", async ({ page }) => {
  const bad = await page.request.post("/api/wishlist", {
    data: { contact: { name: "X", email: "nope" }, items: [] },
  });
  expect(bad.status()).toBe(422);
});
