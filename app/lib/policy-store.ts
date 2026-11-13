/**
 * Policy store — F-23: policies are persisted and fetchable. Only the
 * SHA-256 of the mandate is stored (never raw mandate text — it may contain
 * treasury context). Same durable single-instance JSON pattern as the
 * deposit store (Postgres swap documented in LIMITATIONS #14).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { AgentPolicy } from "@/app/lib/agent-policy";

export interface StoredPolicy {
  id: string; // sha256(mandate)
  policy: AgentPolicy;
  position_id: number | null; // set when a deposit references this policy
  created_at: string;
}

const STORE_PATH = process.env.POLICY_STORE_PATH || ".data/policies.json";

function readAll(): Record<string, StoredPolicy> {
  if (!existsSync(STORE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(store: Record<string, StoredPolicy>): void {
  mkdirSync(STORE_PATH.substring(0, STORE_PATH.lastIndexOf("/")) || ".", { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

/** The policy id is the SHA-256 of the mandate — deterministic, no PII. */
export function policyId(mandate: string): string {
  return createHash("sha256").update(mandate).digest("hex").slice(0, 32);
}

export function savePolicy(
  id: string,
  policy: AgentPolicy,
  mandateHash: string
): StoredPolicy {
  const store = readAll();
  const record: StoredPolicy = {
    id,
    policy,
    position_id: store[id]?.position_id ?? null,
    created_at: store[id]?.created_at ?? new Date().toISOString(),
  };
  store[id] = record;
  writeAll(store);
  return record;
}

export function linkPosition(id: string, positionId: number): void {
  const store = readAll();
  if (store[id]) {
    store[id].position_id = positionId;
    writeAll(store);
  }
}

export function getPolicy(id: string): StoredPolicy | null {
  return readAll()[id] ?? null;
}

export function hashMandate(mandate: string): string {
  return createHash("sha256").update(mandate).digest("hex");
}
