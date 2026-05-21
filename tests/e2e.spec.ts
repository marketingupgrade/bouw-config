import { test, expect, type Page } from "@playwright/test";

// Parse a Dutch euro string like "€ 106.383" into a number.
function euro(text: string): number {
  const digits = text.replace(/[^\d]/g, "");
  return Number(digits);
}

async function footerTotal(page: Page): Promise<number> {
  return euro((await page.getByTestId("footer-total").innerText()).trim());
}

test("configurator end-to-end: 3 steps, 3D canvas, live pricing, lead form", async ({ page }) => {
  await page.goto("/aanbouw");

  // --- Header / shell ---
  await expect(page.getByText("Bureau Wijnschenk")).toBeVisible();
  await expect(page.getByText("Stap 1 van 3")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Afmetingen" })).toBeVisible();

  // --- 3D canvas actually mounts and has a live WebGL context ---
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const gl = await canvas.evaluate((c: HTMLCanvasElement) => {
    const ctx = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    return ctx ? { w: ctx.drawingBufferWidth, h: ctx.drawingBufferHeight } : null;
  });
  expect(gl, "WebGL context should exist").not.toBeNull();
  expect(gl!.w).toBeGreaterThan(0);
  expect(gl!.h).toBeGreaterThan(0);

  // --- Step 1: model selection + dimension slider drive the area + price ---
  const startTotal = await footerTotal(page);
  expect(startTotal).toBeGreaterThan(0);

  const gasten = page.getByRole("button", { name: /Gastenverblijf/ });
  await gasten.click();
  await expect(gasten).toHaveAttribute("aria-pressed", "true");

  const sliders = page.locator('input[type="range"]');
  await expect(sliders).toHaveCount(3);
  // Max out the width slider -> area and price must increase.
  await sliders.nth(0).focus();
  await sliders.nth(0).press("End");
  await expect(page.getByText(/m²/).first()).toBeVisible();
  const afterDims = await footerTotal(page);
  expect(afterDims).toBeGreaterThan(startTotal);

  // --- Step 2: options change the price ---
  await page.getByRole("button", { name: "Volgende stap" }).click();
  await expect(page.getByRole("heading", { name: "Opties" })).toBeVisible();

  const beforeOptions = await footerTotal(page);
  await page.getByRole("button", { name: /Trespa plaat antraciet/ }).click();
  await page.getByRole("button", { name: /Lessenaarsdak/ }).click();
  await page.getByRole("switch", { name: /Buitenkraan/ }).click(); // toggle on
  const afterOptions = await footerTotal(page);
  expect(afterOptions).toBeGreaterThan(beforeOptions);

  // Increment a counter (schuifpui) and confirm price rises again.
  const beforeCounter = await footerTotal(page);
  const schuifpuiRow = page.getByText(/Glazen schuifpui/).locator("..");
  await schuifpuiRow.getByRole("button", { name: "Meer" }).click();
  expect(await footerTotal(page)).toBeGreaterThan(beforeCounter);

  // --- Step 3: summary, breakdown, lead form ---
  await page.getByRole("button", { name: "Volgende stap" }).click();
  await expect(page.getByRole("heading", { name: "Offerte", exact: true })).toBeVisible();

  // Summary reflects earlier choices.
  await expect(page.getByText("Gastenverblijf", { exact: true })).toBeVisible();
  await expect(page.getByText("Trespa plaat antraciet", { exact: true })).toBeVisible();
  await expect(page.getByText("Lessenaarsdak", { exact: true })).toBeVisible();

  // Breakdown totals present.
  await expect(page.getByText("Totaal (incl. btw)")).toBeVisible();
  await expect(page.getByText("Btw 21%")).toBeVisible();

  // Fill + submit the lead form.
  await page.getByPlaceholder("Naam").fill("Jan de Vries");
  await page.getByPlaceholder("E-mailadres").fill("jan@example.nl");
  await page.getByPlaceholder("Telefoonnummer").fill("0612345678");
  await page.getByPlaceholder("Postcode").fill("1011AB");
  await page.getByPlaceholder(/toelichting/).fill("Graag een offerte.");

  await page.getByRole("button", { name: /Vraag vrijblijvend offerte aan/ }).click();
  await expect(page.getByText("Bedankt voor je aanvraag!")).toBeVisible({ timeout: 10_000 });

  await page.screenshot({ path: "test-results/step3-confirmation.png", fullPage: true });
});

test("form validation rejects an invalid email", async ({ page }) => {
  const res = await page.request.post("/api/quote", {
    data: { contact: { name: "Test", email: "not-an-email" }, config: {} },
  });
  expect(res.status()).toBe(422);
});
