import { describe, it, expect } from "vitest";
import {
  savePolicy,
  getPolicy,
  linkPosition,
  resetPolicies,
} from "@/app/lib/policy-store-pg";

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)("policy store on REAL Postgres/Supabase", () => {
  it("saves, reads and links a policy (idempotent upsert)", async () => {
    await resetPolicies();
    const policy = {
      floor_ratio_bps: 8500,
      term_seconds: 2_592_000,
      de_risk_trigger_bps: 5000,
      rationale: "max loss 15%",
      source: "parser" as const,
    };
    await savePolicy("pg-policy-1", policy, "deadbeef");
    await savePolicy("pg-policy-1", policy, "deadbeef"); // idempotent replay

    const got = await getPolicy("pg-policy-1");
    expect(got).not.toBeNull();
    expect(got?.policy.floor_ratio_bps).toBe(8500);
    expect(got?.position_id).toBeNull();

    await linkPosition("pg-policy-1", 42);
    const linked = await getPolicy("pg-policy-1");
    expect(linked?.position_id).toBe(42);
  });

  it("returns null for an unknown policy id", async () => {
    await resetPolicies();
    expect(await getPolicy("nope")).toBeNull();
  });
});
