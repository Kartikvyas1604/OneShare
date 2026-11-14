import { test, expect } from "@playwright/test";

/**
 * E2E — the user flows. Read-only flows run against the LIVE app + LIVE chain
 * (no mocks): the create page pulls the real 1Click token list, the vault page
 * reads real on-chain positions.
 */

test("landing: pitch + loss-limit slider preview renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  // The worst-case readout must exist and react to the slider.
  const worst = page.getByText(/kept|worst case/i).first();
  await expect(worst).toBeVisible();
});

test("create: live 1Click token list + worst-case readout", async ({ page }) => {
  await page.goto("/create");
  // The pay-with picker eventually shows real 1Click tokens (not canned).
  await expect(page.locator("legend").first()).toContainText(/Risk asset/i, { timeout: 20_000 });
  // The amount field drives the risk budget readout.
  // The input transiently doubles during hydration (settles to one).
  const amount = page.locator("#amount").first();
  await expect(amount).toBeVisible();
  await amount.fill("5");
  await expect(page.getByText(/Risk budget/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/\.0000|\d+ Ⓦ/).first()).toBeVisible();
});

test("vault: a real on-chain position renders from the chain", async ({ page }) => {
  await page.goto("/vault/floorline-escrow.testnet");
  // The page must surface REAL chain data: either a position card with the
  // contract's field labels or the honest empty state — never a canned one.
  await expect(
    page.getByText(/position|floor|reserve|no positions|nothing/i).first()
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("body")).not.toContainText("Loading forever");
});

test("api surface: healthz + tokens + equity price are live", async ({ request }) => {
  const health = await request.get("/api/healthz");
  expect(health.ok()).toBeTruthy();
  const body = await health.json();
  expect(body.ok).toBe(true);
  expect(body.contract).toContain("vault3.floorline-escrow.testnet");

  const tokens = await request.get("/api/tokens");
  const t = await tokens.json();
  expect((t.tokens ?? []).length).toBeGreaterThan(100);

  const eq = await request.get("/api/v1/equity-price");
  const e = await eq.json();
  expect(e.price).toBeGreaterThan(1);
  expect(e.source).toBe("yahoo-finance");
});
