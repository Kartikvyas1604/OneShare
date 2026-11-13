import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Durable deposit tracking. Records survive server restarts (JSON file on
 * disk, path overridable via DEPOSITS_STORE_PATH for a volume mount). A
 * record holds only non-sensitive operational data: the 1Click deposit
 * address, amount, asset, deadline, and timestamps — no keys, no personal
 * data. Retention: records are pruned 30 days after creation on write.
 *
 * Single-process safe (tmp-write + rename); for multi-instance production,
 * point DEPOSITS_STORE_PATH at a mounted volume or swap this module for the
 * Postgres store described in docs/DECISIONS.md.
 */

const STORE_PATH = process.env.DEPOSITS_STORE_PATH ?? path.join(process.cwd(), ".data", "deposits.json");
const RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

export interface DepositRecord {
  depositAddress: string;
  amountMicro: number;
  destinationAsset: string;
  deadlineIso: string;
  createdAt: number;
  /** Last status observed from 1Click (informational; /v0/status is live). */
  lastStatus?: string;
  lastCheckedAt?: number;
}

async function readAll(): Promise<Record<string, DepositRecord>> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, DepositRecord>;
  } catch {
    return {};
  }
}

async function writeAll(store: Record<string, DepositRecord>): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, STORE_PATH);
}

/** Persist a newly generated deposit address. */
export async function saveDeposit(record: DepositRecord): Promise<void> {
  const store = await readAll();
  const cutoff = Date.now() - RETENTION_MS;
  for (const [addr, rec] of Object.entries(store)) {
    if (rec.createdAt < cutoff) delete store[addr]; // retention policy
  }
  store[record.depositAddress] = record;
  await writeAll(store);
}

/** Load one record (or null). */
export async function getDeposit(depositAddress: string): Promise<DepositRecord | null> {
  const store = await readAll();
  return store[depositAddress] ?? null;
}

/** Attach the latest observed status (kept for ops; live status always wins). */
export async function updateDepositStatus(
  depositAddress: string,
  lastStatus: string
): Promise<void> {
  const store = await readAll();
  const rec = store[depositAddress];
  if (!rec) return;
  rec.lastStatus = lastStatus;
  rec.lastCheckedAt = Date.now();
  await writeAll(store);
}
