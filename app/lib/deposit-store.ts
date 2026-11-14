/**
 * Deposit persistence — the active store by deploy shape:
 *   DATABASE_URL set  → Postgres 16 (deposit-store-pg.ts, spec §6.3)
 *   otherwise         → the durable JSON store (single-instance deploys)
 * Same interface either way — the callers don't know which backs them.
 */
import type { DepositRecord } from "./deposit-store-json";

type Store = {
  saveDeposit: (row: DepositRecord) => Promise<void>;
  getDeposit: (depositAddress: string) => Promise<DepositRecord | null>;
  updateDepositStatus: (depositAddress: string, lastStatus: string) => Promise<void>;
  allDeposits: () => Promise<DepositRecord[]>;
};

let cached: Store | null = null;

async function store(): Promise<Store> {
  if (!cached) {
    cached = (process.env.DATABASE_URL
      ? await import("./deposit-store-pg")
      : await import("./deposit-store-json")) as unknown as Store;
  }
  return cached;
}

export async function saveDeposit(row: DepositRecord): Promise<void> {
  return (await store()).saveDeposit(row);
}

export async function getDeposit(depositAddress: string): Promise<DepositRecord | null> {
  return (await store()).getDeposit(depositAddress);
}

export async function updateDepositStatus(
  depositAddress: string,
  lastStatus: string
): Promise<void> {
  return (await store()).updateDepositStatus(depositAddress, lastStatus);
}

export async function allDeposits(): Promise<DepositRecord[]> {
  return (await store()).allDeposits();
}

export const TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "REFUNDED",
  "FAILED",
  "INCOMPLETE_DEPOSIT",
]);
