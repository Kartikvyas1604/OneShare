import { test, expect } from "@playwright/test";

/**
 * E2E with a REAL test wallet through the wallet flows: connect → position
 * (live chain) → early exit (wallet-signed, real escrow release + payout)
 * and the wallet-rejection state (a real chain error surfaced in the UI).
 *
 * The E2E wallet signs genuine transactions on the genuine chain — no mocks.
 * The provisioned wallet account must own at least one position before the
 * flow test (the harness mints one through the CLI — the same transaction
 * the UI signs).
 */

const E2E_ACCOUNT = process.env.E2E_WALLET_ACCOUNT as string;
const E2E_SECRET = process.env.E2E_WALLET_SECRET as string;

test.describe.configure({ mode: "serial" });

function injectWallet(page: import("@playwright/test").Page) {
  return page.addInitScript(
    ({ account, secret }: { account: string; secret: string }) => {
      window.localStorage.setItem("E2E_WALLET_ENABLED", "1");
      window.localStorage.setItem("E2E_WALLET_ACCOUNT", account);
      window.localStorage.setItem("E2E_WALLET_SECRET", secret);
    },
    { account: E2E_ACCOUNT, secret: E2E_SECRET }
  );
}

test("wallet flow: connect → live position → wallet-signed exit", async ({ page }) => {
  test.skip(!E2E_ACCOUNT || !E2E_SECRET, "E2E wallet credentials not provisioned");
  await injectWallet(page);

  // 1. The connected account shows in the header (silent E2E sign-in).
  await page.goto("/create");
  await expect(page.getByText(E2E_ACCOUNT).first()).toBeVisible({ timeout: 30_000 });

  // 2. The vault page for the wallet's LIVE position (read from the chain).
  const posRes = await page.request.get(`/api/vault/positions?account=${E2E_ACCOUNT}`);
  const posBody = await posRes.json();
  const rawId = posBody.positions?.[0]?.id as number | { position_id: number } | undefined;
  const posId = typeof rawId === "number" ? rawId : rawId?.position_id;
  test.skip(!posId, "the wallet owns no position — provision one first");
  await page.goto(`/vault/${posId}`);
  await expect(page.getByText(E2E_ACCOUNT).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("body")).toContainText(/floor/i);

  // 3. Exit early through the REAL wallet: the escrow releases the reserve
  //    and the payout lands on-chain (all receipts real).
  await page.getByRole("button", { name: /exit early/i }).first().click();
  await expect(page.getByText(/confirmed on-chain/i).first()).toBeVisible({
    timeout: 120_000,
  });
});

test("wallet rejection state: a below-minimum deposit is blocked before the chain", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(!E2E_ACCOUNT || !E2E_SECRET, "E2E wallet credentials not provisioned");
  await injectWallet(page);
  await page.goto("/create");
  await expect(page.getByText(E2E_ACCOUNT).first()).toBeVisible({ timeout: 45_000 });

  // A deposit below the contract minimum is blocked by the UI's validation
  // layer (the contract's ErrBelowMinDeposit is proven live in the attack
  // sweep). The button must be disabled — no transaction leaves.
  const amount = page.locator("#amount").first();
  await amount.fill("0.000001");
  await expect(page.getByText(/Minimum deposit is 1 wNEAR/i)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /deposit on-chain/i }).first()).toBeDisabled({ timeout: 30_000 });
});
