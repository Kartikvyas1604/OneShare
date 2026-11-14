import { test, expect } from "@playwright/test";

test("debug incoming actions", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("E2E_WALLET_ENABLED", "1");
    window.localStorage.setItem("E2E_WALLET_ACCOUNT", process.env.E2E_WALLET_ACCOUNT as string);
    window.localStorage.setItem("E2E_WALLET_SECRET", process.env.E2E_WALLET_SECRET as string);
  });
  page.on("console", (m) => console.log("[browser]", m.type(), m.text().slice(0, 250)));
  await page.goto("/create");
  await page.waitForTimeout(5_000);
  const amount = page.locator("#amount").first();
  await amount.fill("1");
  await page.getByRole("button", { name: /deposit/i }).first().click();
  await page.waitForTimeout(12_000);
  const logs: string[] = [];
  await page.waitForTimeout(1_000);
  console.log("PAGE-STATE:", (await page.locator("body").innerText()).slice(0, 500));
});
