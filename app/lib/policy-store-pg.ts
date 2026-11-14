/**
 * Postgres-backed policy store — same interface as the JSON policy store
 * (policy-store.ts). Active when DATABASE_URL is set; the JSON store stays
 * the zero-dependency fallback. Only the SHA-256 of the mandate is stored
 * (never raw mandate text — no PII).
 */
import { Pool } from "pg";
import type { AgentPolicy } from "@/app/lib/agent-policy";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ssl:
    /supabase\.(co|com)|sslmode=require|neon\.tech|render\.com|amazonaws/i.test(
      process.env.DATABASE_URL ?? ""
    )
      ? { rejectUnauthorized: false }
      : undefined,
});

let migrated = false;

export interface StoredPolicyRow {
  id: string;
  mandate_hash: string;
  policy: AgentPolicy;
  position_id: number | null;
  created_at: string;
}

async function ensureMigrated(): Promise<void> {
  if (migrated) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      mandate_hash TEXT NOT NULL,
      floor_ratio_bps INTEGER NOT NULL,
      term_seconds BIGINT NOT NULL,
      de_risk_trigger_bps INTEGER NOT NULL,
      rationale TEXT NOT NULL,
      source TEXT NOT NULL,
      position_id BIGINT,
      created_at TEXT NOT NULL
    )`);
  migrated = true;
}

export async function savePolicy(
  id: string,
  policy: AgentPolicy,
  mandateHash: string
): Promise<StoredPolicyRow> {
  await ensureMigrated();
  const existing = await getPolicy(id);
  const createdAt = existing?.created_at ?? new Date().toISOString();
  const positionId = existing?.position_id ?? null;
  await pool.query(
    `INSERT INTO policies
       (id, mandate_hash, floor_ratio_bps, term_seconds, de_risk_trigger_bps, rationale, source, position_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       floor_ratio_bps = EXCLUDED.floor_ratio_bps,
       term_seconds = EXCLUDED.term_seconds,
       de_risk_trigger_bps = EXCLUDED.de_risk_trigger_bps,
       rationale = EXCLUDED.rationale,
       source = EXCLUDED.source`,
    [
      id,
      mandateHash,
      policy.floor_ratio_bps,
      policy.term_seconds,
      policy.de_risk_trigger_bps,
      policy.rationale,
      policy.source,
      positionId,
      createdAt,
    ],
  );
  return { id, mandate_hash: mandateHash, policy, position_id: positionId, created_at: createdAt };
}

export async function linkPosition(id: string, positionId: number): Promise<void> {
  await ensureMigrated();
  await pool.query(`UPDATE policies SET position_id = $2 WHERE id = $1`, [id, positionId]);
}

export async function getPolicy(id: string): Promise<StoredPolicyRow | null> {
  await ensureMigrated();
  const res = await pool.query(`SELECT * FROM policies WHERE id = $1`, [id]);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    mandate_hash: r.mandate_hash,
    policy: {
      floor_ratio_bps: r.floor_ratio_bps,
      term_seconds: Number(r.term_seconds),
      de_risk_trigger_bps: r.de_risk_trigger_bps,
      rationale: r.rationale,
      source: r.source,
    },
    position_id: r.position_id ? Number(r.position_id) : null,
    created_at: r.created_at,
  };
}

/** Test hook. */
export async function resetPolicies(): Promise<void> {
  await ensureMigrated();
  await pool.query(`DROP TABLE IF EXISTS policies`);
  migrated = false;
  await ensureMigrated();
}
