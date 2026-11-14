/**
 * Policy persistence — the active store by deploy shape:
 *   DATABASE_URL set  → Postgres 16 / Supabase (policy-store-pg.ts)
 *   otherwise         → the durable JSON store (single-instance deploys)
 * Same interface either way. Only the SHA-256 of the mandate is stored
 * (never raw mandate text — no PII), per F-23.
 */
import { createHash } from "node:crypto";
import type { AgentPolicy } from "@/app/lib/agent-policy";

export interface StoredPolicy {
  id: string; // sha256(mandate) truncated
  mandate_hash: string; // the full SHA-256
  policy: AgentPolicy;
  position_id: number | null;
  created_at: string;
}

type Store = {
  savePolicy: (id: string, policy: AgentPolicy, mandateHash: string) => Promise<StoredPolicy>;
  getPolicy: (id: string) => Promise<StoredPolicy | null>;
  linkPosition: (id: string, positionId: number) => Promise<void>;
};

let cached: Store | null = null;

async function store(): Promise<Store> {
  if (!cached) {
    cached = (process.env.DATABASE_URL
      ? await import("./policy-store-pg")
      : await import("./policy-store-json")) as unknown as Store;
  }
  return cached;
}

export function policyId(mandate: string): string {
  return createHash("sha256").update(mandate).digest("hex").slice(0, 32);
}

export function hashMandate(mandate: string): string {
  return createHash("sha256").update(mandate).digest("hex");
}

export async function savePolicy(
  id: string,
  policy: AgentPolicy,
  mandateHash: string
): Promise<StoredPolicy> {
  return (await store()).savePolicy(id, policy, mandateHash);
}

export async function linkPosition(id: string, positionId: number): Promise<void> {
  return (await store()).linkPosition(id, positionId);
}

export async function getPolicy(id: string): Promise<StoredPolicy | null> {
  return (await store()).getPolicy(id);
}
