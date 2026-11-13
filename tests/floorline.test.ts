import { describe, expect, it } from "vitest";
import {
  splitDeposit,
  unitValueQuote,
  navQuote,
  worstCaseQuote,
  cushionQuote,
  deRiskTriggered,
  drawdownBps,
  earlyExitPayout,
  targetUnits,
  entryPriceUsdc,
  VAULT_CONFIG,
  RISK_ASSETS,
} from "@/app/lib/floorline";

/**
 * Formula tests per Agent.md §4.2/§4.5 — the same numbers the Rust contract
 * tests must produce (golden vector pinned by §4.5).
 */

describe("splitDeposit (1)/(2)", () => {
  it("splits exactly and floor-rounds the reserve", () => {
    expect(splitDeposit(1_000_000_000, 9_000)).toEqual({
      floorAmount: 900_000_000,
      riskBudget: 100_000_000,
    });
    // floor, never round up: 10_000_001 * 90% = 9_000_000.9 → 9_000_000
    expect(splitDeposit(10_000_001, 9_000).floorAmount).toBe(9_000_000);
  });

  it("reserves the full deposit at 98% and nothing extra", () => {
    expect(splitDeposit(1_000_000, 9_800)).toEqual({
      floorAmount: 980_000,
      riskBudget: 20_000,
    });
  });

  it("keeps floor + risk budget == deposit for random amounts (F-03)", () => {
    for (let i = 0; i < 1_000; i++) {
      const d = Math.floor(Math.random() * 100_000_000_000) + VAULT_CONFIG.minDeposit;
      const ratio = VAULT_CONFIG.floorRatioMinBps + 100 * Math.floor(Math.random() * 49);
      const { floorAmount, riskBudget } = splitDeposit(d, ratio);
      expect(floorAmount + riskBudget).toBe(d);
      expect(floorAmount).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("unitValueQuote (3) and targetUnits (10) — golden vector §4.5", () => {
  // D = 1,000 USDC, floor 90%, P = $3.58 ⇒ q* ≈ 27.932960893854748 wNEAR
  it("computes the golden-vector target units", () => {
    const q = targetUnits(100_000_000, 3.58);
    expect(q).toBeCloseTo(27.932960893854748, 10);
  });

  it("values the golden-vector position back at its cost", () => {
    const value = unitValueQuote(27.932960893854748, 3.58);
    expect(value).toBeCloseTo(100_000_000, -1); // within rounding to the risk budget
  });
});

describe("NAV (4), worst case, cushion (5)", () => {
  const p = {
    floor_amount: 900_000_000,
    risk_units: 27.932960893854748,
    realised_quote: 0,
    cost_basis: 100_000_000,
    de_risked: false,
  };

  it("NAV = floor + bucket value + realised", () => {
    expect(navQuote(p, 3.85)).toBe(900_000_000 + Math.round(27.932960893854748 * 3.85 * 1e6));
  });

  it("worst case is floor + realised — never below the floor", () => {
    expect(worstCaseQuote(p)).toBe(900_000_000);
    expect(worstCaseQuote({ ...p, realised_quote: 24_000_000, risk_units: 0, de_risked: true })).toBe(
      924_000_000
    );
  });

  it("cushion is NAV minus floor and never negative by construction", () => {
    expect(cushionQuote(p, 3.85)).toBe(unitValueQuote(p.risk_units, 3.85));
    expect(cushionQuote({ ...p, risk_units: 0 }, 3.85)).toBe(0);
  });
});

describe("de-risk trigger (6) — strict <, single-shot (I6)", () => {
  const base = {
    floor_amount: 900_000_000,
    realised_quote: 0,
    cost_basis: 100_000_000,
    de_risked: false,
  };

  it("does not fire at exactly the boundary (§4.7 #3)", () => {
    // unit value exactly == cost × (1 − 50%) → 50_000_000
    const boundary = { ...base, risk_units: 50_000_000 / 1e6 / 3.58 };
    expect(deRiskTriggered(boundary, 3.58)).toBe(false);
  });

  it("fires just below the boundary", () => {
    const below = { ...base, risk_units: (50_000_000 - 1) / 1e6 / 3.58 };
    expect(deRiskTriggered(below, 3.58)).toBe(true);
  });

  it("never fires twice (I6 latch)", () => {
    const latched = { ...base, risk_units: 1, de_risked: true };
    expect(deRiskTriggered(latched, 0.01)).toBe(false);
  });

  it("does not fire with no cost basis yet", () => {
    expect(deRiskTriggered({ ...base, cost_basis: 0, risk_units: 0 }, 3.58)).toBe(false);
  });
});

describe("drawdown", () => {
  it("is 0 with no cost basis or no units", () => {
    expect(drawdownBps({ cost_basis: 0, risk_units: 0 }, 3.58)).toBe(0);
    expect(drawdownBps({ cost_basis: 100_000_000, risk_units: 0 }, 3.58)).toBe(0);
  });

  it("reports 5,000 bps at exactly half the cost", () => {
    const q = 50_000_000 / 1e6 / 3.58;
    expect(drawdownBps({ cost_basis: 100_000_000, risk_units: q }, 3.58)).toBe(5_000);
  });
});

describe("early exit (8)", () => {
  it("applies the 1% fee with floor division", () => {
    const p = {
      floor_amount: 900_000_000,
      risk_units: 27.932960893854748,
      realised_quote: 0,
      cost_basis: 100_000_000,
      de_risked: false,
    };
    const nav = navQuote(p, 3.58); // = 1_000_000_000-ish
    expect(earlyExitPayout(p, 3.58)).toBe(Math.floor((nav * 9_900) / 10_000));
  });
});

describe("entry price", () => {
  it("derives the paid price from cost basis and units", () => {
    expect(entryPriceUsdc({ cost_basis: 100_000_000, risk_units: 27.932960893854748 })).toBeCloseTo(
      3.58,
      9
    );
  });

  it("is 0 with no units", () => {
    expect(entryPriceUsdc({ cost_basis: 100_000_000, risk_units: 0 })).toBe(0);
  });
});

describe("config invariants (§4.1)", () => {
  it("floor ratio range and step match the spec", () => {
    expect(VAULT_CONFIG.floorRatioMinBps).toBe(5_000);
    expect(VAULT_CONFIG.floorRatioMaxBps).toBe(9_800);
    expect(VAULT_CONFIG.floorRatioStepBps).toBe(100);
  });

  it("risk-asset candidates carry honest verification flags (G-2)", () => {
    const verified = RISK_ASSETS.filter((a) => a.verified);
    expect(verified).toHaveLength(1);
    expect(verified[0].assetId).toBe("nep141:wrap.near");
  });
});
