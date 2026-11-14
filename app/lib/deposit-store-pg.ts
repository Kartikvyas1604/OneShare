/**
 * Postgres-backed deposit store — the spec's §6.3 persistence (Postgres 16).
 *
 * Same interface as the JSON store (deposit-store.ts): the callers don't
 * know which one backs them. Active when DATABASE_URL is set; the JSON
 * store remains the zero-dependency fallback for a single-instance deploy
 * (LIMITATIONS #14 documents the swap).
 */
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

// Surface a real message when the DB is down (an empty "" error helps nobody).
pool.on("error", (err) => {
  console.error("[deposit-store-pg] connection error:", err.message);
});

let migrated = false;

export interface DepositRow {
  depositAddress: string;
  amountMicro: number;
  destinationAsset: string;
  deadlineIso: string;
  createdAt: number;
  lastStatus: string | null;
  lastCheckedAt: number | null;
}

async function ensureMigrated(): Promise<void> {
  if (migrated) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deposits (
      deposit_address TEXT PRIMARY KEY,
      amount_micro BIGINT NOT NULL,
      destination_asset TEXT NOT NULL,
      deadline_iso TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      last_status TEXT,
      last_checked_at BIGINT
    )`);
  migrated = true;
}

export async function saveDeposit(row: DepositRow): Promise<void> {
  await ensureMigrated();
  await pool.query(
    `INSERT INTO deposits
       (deposit_address, amount_micro, destination_asset, deadline_iso, created_at, last_status, last_checked_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (deposit_address) DO UPDATE SET
       amount_micro = EXCLUDED.amount_micro,
       destination_asset = EXCLUDED.destination_asset,
       deadline_iso = EXCLUDED.deadline_iso,
       last_status = EXCLUDED.last_status,
       last_checked_at = EXCLUDED.last_checked_at`,
    [
      row.depositAddress,
      row.amountMicro,
      row.destinationAsset,
      row.deadlineIso,
      row.createdAt,
      row.lastStatus,
      row.lastCheckedAt,
    ],
  );
}

export async function getDeposit(depositAddress: string): Promise<DepositRow | null> {
  await ensureMigrated();
  const res = await pool.query(`SELECT * FROM deposits WHERE deposit_address = $1`, [
    depositAddress,
  ]);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function updateDepositStatus(
  depositAddress: string,
  lastStatus: string
): Promise<void> {
  await ensureMigrated();
  await pool.query(
    `UPDATE deposits SET last_status = $2, last_checked_at = $3 WHERE deposit_address = $1`,
    [depositAddress, lastStatus, Date.now()],
  );
}

export async function allDeposits(): Promise<DepositRow[]> {
  await ensureMigrated();
  const res = await pool.query(`SELECT * FROM deposits ORDER BY created_at ASC`);
  return res.rows.map(mapRow);
}

export const TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "REFUNDED",
  "FAILED",
  "INCOMPLETE_DEPOSIT",
]);

function mapRow(r: Record<string, unknown>): DepositRow {
  return {
    depositAddress: r.deposit_address as string,
    amountMicro: Number(r.amount_micro),
    destinationAsset: r.destination_asset as string,
    deadlineIso: r.deadline_iso as string,
    createdAt: Number(r.created_at),
    lastStatus: (r.last_status as string) ?? null,
    lastCheckedAt: r.last_checked_at ? Number(r.last_checked_at) : null,
  };
}

/** Test hook: drop + recreate the table. */
export async function resetDeposits(): Promise<void> {
  await ensureMigrated();
  await pool.query(`DROP TABLE IF EXISTS deposits`);
  migrated = false;
  await ensureMigrated();
}
