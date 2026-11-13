import { describe, expect, it } from "vitest";
import { simulateCrash, DEFAULT_SEED, DEMO_SHOCK_PCT } from "@/app/lib/crash-sim";

/**
 * Determinism (NF-03), the three-arm mechanism (§6.4), and the demo-script
 * invariant (§11: "a −45% crash. Naive loses 45%").
 */

describe("simulateCrash", () => {
  it("is byte-identical for identical (shock, seed) — NF-03", () => {
    const a = simulateCrash(DEMO_SHOCK_PCT);
    const b = simulateCrash(DEMO_SHOCK_PCT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("differs when the seed differs", () => {
    const a = simulateCrash(DEMO_SHOCK_PCT);
    const b = simulateCrash(DEMO_SHOCK_PCT, { seed: 999 });
    expect(a.arms[0].medianTerminalUsd).not.toBe(b.arms[0].medianTerminalUsd);
  });

  it("runs three arms with sane metadata", () => {
    const r = simulateCrash(DEMO_SHOCK_PCT);
    expect(r.arms.map((a) => a.key)).toEqual(["naive", "static", "derisk"]);
    expect(r.nPaths).toBe(10_000);
    expect(r.nSteps).toBe(90);
    for (const arm of r.arms) {
      expect(arm.path).toHaveLength(r.nSteps + 1);
      expect(arm.medianTerminalUsd).toBeGreaterThan(0);
      expect(arm.worstTerminalUsd).toBeGreaterThan(0);
      expect(arm.worstTerminalUsd).toBeLessThanOrEqual(arm.medianTerminalUsd);
    }
  });

  it("the demo script holds: a −45% shock loses ≈45% naive (median-neutral)", () => {
    const r = simulateCrash(DEMO_SHOCK_PCT);
    const naive = r.arms[0];
    expect(naive.medianLossPct).toBeGreaterThan(-46); // ≤1pp from −45 (F-16 tolerance)
    expect(naive.medianLossPct).toBeLessThan(-44);
  });

  it("the floor arms cap the median loss near −5% at −45% shock", () => {
    const r = simulateCrash(DEMO_SHOCK_PCT);
    for (const key of ["static", "derisk"] as const) {
      const arm = r.arms.find((a) => a.key === key)!;
      expect(arm.medianLossPct).toBeGreaterThan(-7); // worst case −10%, median ≈ −4.5
      expect(arm.medianLossPct).toBeLessThan(0);
    }
  });

  it("a 0% shock keeps everyone near flat — no hidden drift", () => {
    const r = simulateCrash(0);
    for (const arm of r.arms) {
      expect(Math.abs(arm.medianLossPct)).toBeLessThan(1.5); // median-neutral GBM
    }
  });

  it("a −90% wipeout never takes the floored depositor below the reserve", () => {
    const r = simulateCrash(-90);
    const naive = r.arms[0];
    expect(naive.medianLossPct).toBeLessThan(-89); // naive wiped
    for (const key of ["static", "derisk"] as const) {
      const arm = r.arms.find((a) => a.key === key)!;
      expect(arm.medianTerminalUsd).toBeGreaterThan(900); // ≥ the $900 reserve
    }
  });

  it("upside shocks still flow to the naive arm — no artificial cap", () => {
    const r = simulateCrash(30);
    const naive = r.arms[0];
    expect(naive.medianTerminalUsd).toBeGreaterThan(1_250); // +30% shock survives GBM
  });

  it("de-risk arm never underperforms the naive arm's worst case at deep crashes", () => {
    for (const shock of [-50, -60, -70]) {
      const r = simulateCrash(shock);
      const naiveWorst = r.arms[0].worstTerminalUsd;
      const deriskWorst = r.arms[2].worstTerminalUsd;
      expect(deriskWorst).toBeGreaterThan(naiveWorst);
    }
  });

  it("respects the default seed constant", () => {
    expect(DEFAULT_SEED).toBe(20261112);
  });
});
