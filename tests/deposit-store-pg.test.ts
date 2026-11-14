import { describe, it, expect, afterAll } from "vitest";
import {
  saveDeposit,
  getDeposit,
  updateDepositStatus,
  allDeposits,
  resetDeposits,
  TERMINAL_STATUSES,
} from "@/app/lib/deposit-store-pg";

/**
 * REAL Postgres integration: runs against a live Postgres 16 (docker) via
 * DATABASE_URL. Skipped when no DATABASE_URL — the JSON store covers that
 * deploy shape (documented in LIMITATIONS).
 */
const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)("deposit store on REAL Postgres", () => {
  it("saves, reads and updates a deposit row (idempotent upsert)", async () => {
    await resetDeposits();
    const row = {
      depositAddress: "pg-test-deposit-1",
      amountMicro: 1_000_000,
      destinationAsset: "nep141:wrap.near",
      deadlineIso: "2026-11-14T23:59:00.000Z",
      createdAt: Date.now(),
      lastStatus: "PENDING_DEPOSIT",
      lastCheckedAt: Date.now(),
    };
    await saveDeposit(row);
    await saveDeposit(row); // idempotent: the upsert replays cleanly

    const got = await getDeposit("pg-test-deposit-1");
    expect(got).not.toBeNull();
    expect(got?.depositAddress).toBe("pg-test-deposit-1");
    expect(got?.amountMicro).toBe(1_000_000);
    expect(got?.lastStatus).toBe("PENDING_DEPOSIT");

    await updateDepositStatus("pg-test-deposit-1", "SUCCESS");
    const updated = await getDeposit("pg-test-deposit-1");
    expect(updated?.lastStatus).toBe("SUCCESS");

    const all = await allDeposits();
    expect(all.length).toBe(1);
  });

  it("returns null for an unknown address", async () => {
    await resetDeposits();
    expect(await getDeposit("unknown-address-xyz")).toBeNull();
  });

  it("classifies terminal statuses for the reconcile sweep", () => {
    expect(TERMINAL_STATUSES.has("SUCCESS")).toBe(true);
    expect(TERMINAL_STATUSES.has("REFUNDED")).toBe(true);
    expect(TERMINAL_STATUSES.has("FAILED")).toBe(true);
    expect(TERMINAL_STATUSES.has("PENDING_DEPOSIT")).toBe(false);
  });

  afterAll(async () => {
    // vitest teardown: the pool closes with the process.
  });
});
