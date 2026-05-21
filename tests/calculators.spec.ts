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

test("lead api rejects invalid email", async ({ page }) => {
  const res = await page.request.post("/api/lead", {
    data: { calculator: "stucwerk", contact: { name: "X", email: "nope" } },
  });
  expect(res.status()).toBe(422);
});
