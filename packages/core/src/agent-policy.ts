/**
 * Agent policy parser + clamp — pure functions, no network (U1.2).
 *
 * The clamp is the enforcement point. An LLM (or a jailbroken prompt) may
 * PROPOSE anything; every field is re-clamped here before it reaches the
 * chain, and the vault contract clamps AGAIN (F-22). Prompt-level guardrails
 * are advisory; custody is not.
 */

export const AGENT_POLICY_MAX_MANDATE_CHARS = 2_000;

export interface AgentPolicy {
  floor_ratio_bps: number; // 5000..9800, step ≤100. max loss = 10000 − floor_ratio_bps
  term_seconds: number; // 86400..7776000
  de_risk_trigger_bps: number; // clamp [1000..9000], default 5000
  rationale: string; // ≤280 chars, shown in the demo
  source: "parser" | "llm";
}

export interface PolicyRequest {
  mandate: string; // 1..AGENT_POLICY_MAX_MANDATE_CHARS chars
}

export type PolicyResult =
  | { ok: true; policy: AgentPolicy }
  | { ok: false; error: string; remediation: string };

/** floor_ratio_bps = 10000 − max_loss_percent × 100. */
function maxLossToFloor(pct: number): number {
  return 10_000 - Math.round(pct * 100);
}

/** Clamp with step-100 snapping; reports whether clamping happened. */
export function clampFloorRatio(bps: number): { value: number; clamped: boolean } {
  let v = Math.round(bps / 100) * 100;
  let clamped = false;
  if (v > 9_800) {
    v = 9_800;
    clamped = true;
  }
  if (v < 5_000) {
    v = 5_000;
    clamped = true;
  }
  return { value: v, clamped };
}

export function clampTermSeconds(s: number): number {
  if (!Number.isFinite(s)) return 2_592_000;
  return Math.min(7_776_000, Math.max(86_400, Math.round(s)));
}

export function clampDeRiskTrigger(bps: number): number {
  if (!Number.isFinite(bps)) return 5_000;
  return Math.min(9_000, Math.max(1_000, Math.round(bps / 100) * 100));
}

/**
 * Deterministic mandate parser. Golden cases (asserted in tests):
 *   "never lose more than 15%" / "max loss 15%" / "15% max loss" → 8500
 *   "worst case 10%" → 9000
 *   "never lose more than 50%" → 5000
 *   "never lose more than 3%" → 9700
 *   "never lose more than 1%" → 9800 (clamped) + rationale mentions clamped
 *   no percentage → 422 via { ok: false }
 */
export function parsePolicy(mandate: string): PolicyResult {
  if (typeof mandate !== "string" || mandate.trim().length === 0) {
    return {
      ok: false,
      error: "mandate is empty",
      remediation: "Send a treasury policy in plain English, e.g. 'never lose more than 15%'.",
    };
  }
  if (mandate.length > AGENT_POLICY_MAX_MANDATE_CHARS) {
    return {
      ok: false,
      error: `mandate exceeds ${AGENT_POLICY_MAX_MANDATE_CHARS} chars`,
      remediation: "Shorten the mandate to the loss-limit sentence and the term.",
    };
  }

  const text = mandate.toLowerCase();

  // Percentages: "never lose more than 15%", "max loss 15%", "15% max loss",
  // "worst case 10%", "loss limit 20%".
  const patterns = [
    /(?:never\s+lose|maximum\s+loss|max\s+loss|loss\s+limit|worst\s+case|max(?:imum)?\s+drawdown)[^0-9%]{0,40}?(\d+(?:\.\d+)?)\s*%/,
    /(\d+(?:\.\d+)?)\s*%\s*(?:max\s+loss|maximum\s+loss|max\s+drawdown)/,
  ];
  let pct: number | null = null;
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      pct = Number(m[1]);
      break;
    }
  }

  if (pct === null || !Number.isFinite(pct) || pct <= 0 || pct >= 100) {
    return {
      ok: false,
      error: "no usable loss-limit percentage found in the mandate",
      remediation:
        "State the worst case explicitly, e.g. 'the treasury must never lose more than 15%'.",
    };
  }

  const rawFloor = maxLossToFloor(pct);
  const floor = clampFloorRatio(rawFloor);

  // Term: "30 days" / "1 week" / "90 days"; default 30 days.
  let term = 2_592_000;
  const termMatch = text.match(/(\d+)\s*(day|week|month)/);
  if (termMatch) {
    const n = Number(termMatch[1]);
    const unit = termMatch[2];
    term = clampTermSeconds(
      unit === "day" ? n * 86_400 : unit === "week" ? n * 604_800 : n * 2_592_000
    );
  }

  // De-risk trigger: "de-risk early"/"derisk early" → 3000 (−70%), else 5000.
  const early = /de-?\s?risk\s+(early|fast|soon)/.test(text);
  const trigger = clampDeRiskTrigger(early ? 3_000 : 5_000);

  const rationale = `Parsed from mandate: max loss ${pct}% → floor ${(floor.value / 100).toFixed(0)}%${floor.clamped ? " (clamped to the 2% minimum loss)" : ""}; term ${Math.round(term / 86_400)}d; de-risk trigger −${(100 - trigger / 100).toFixed(0)}% from cost.${early ? " Early de-risk requested." : ""}`;

  return {
    ok: true,
    policy: {
      floor_ratio_bps: floor.value,
      term_seconds: term,
      de_risk_trigger_bps: trigger,
      rationale: rationale.slice(0, 280),
      source: "parser",
    },
  };
}

/** The LLM leg passes through the SAME clamp — the LLM is never trusted. */
export function clampLlmPolicy(candidate: unknown): PolicyResult {
  if (typeof candidate !== "object" || candidate === null) {
    return { ok: false, error: "LLM returned no object", remediation: "Retried the parser output." };
  }
  const c = candidate as Record<string, unknown>;
  const floorRaw = Number(c.floor_ratio_bps);
  if (!Number.isFinite(floorRaw)) {
    return { ok: false, error: "LLM returned no floor_ratio_bps", remediation: "Retried the parser output." };
  }
  const floor = clampFloorRatio(floorRaw);
  const policy: AgentPolicy = {
    floor_ratio_bps: floor.value,
    term_seconds: clampTermSeconds(Number(c.term_seconds)),
    de_risk_trigger_bps: clampDeRiskTrigger(Number(c.de_risk_trigger_bps)),
    rationale: String(c.rationale ?? "").slice(0, 280) || "LLM-proposed, contract-clamped policy.",
    source: "llm",
  };
  return { ok: true, policy };
}

/** The on-chain msg for a per-deposit loss limit (F-22 enforces it again). */
export function depositMsgFor(policy: AgentPolicy): string {
  return `deposit:${policy.floor_ratio_bps}`;
}
