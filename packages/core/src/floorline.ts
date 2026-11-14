/**
 * Floorline core — single source of truth for the web app.
 *
 * NO fixture data lives here: positions, events, and prices all come from real
 * sources (NEAR RPC view calls, the 1Click token list) via app/lib/vault.ts and
 * app/api/prices. What remains are contract parameters and pure formula code —
 * the same constants the on-chain contract encodes.
 *
 * All money math here is f64 and display-only (on-chain math is u128 with
 * checked ops in contracts/vault/src/math.rs). Quote amounts are micro-USDC
 * (1e6 = $1.00), matching the 6-decimal quote asset.
 */

/* ─── Vault config (contract VaultConfig defaults) ─── */

export const VAULT_CONFIG = {
  quoteAssetId:
    "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1" as const, // USDC on NEAR, 6 dec
  riskAssetId: "nep141:wrap.near" as const, // wNEAR, 24 dec — live fallback route
  floorRatioBps: 9_000, // 90.00% of deposit escrowed as reserve
  floorRatioMinBps: 5_000, // 50%
  floorRatioMaxBps: 9_800, // 98%
  floorRatioStepBps: 100, // 1%
  termSeconds: 2_592_000, // 30 days
  termMinSeconds: 86_400, // 1 day
  termMaxSeconds: 7_776_000, // 90 days
  deRiskTriggerBps: 5_000, // sell the risk bucket at −50% drawdown from cost basis
  minDeposit: 10_000_000, // 10.00 USDC
  maxTvl: 100_000_000_000, // 100,000.00 USDC
  priceMaxAgeSec: 60,
  oracleDisagreementBps: 300, // 3%
  settlementTimeoutSec: 1_200, // 20 min
  earlyExitFeeBps: 100, // 1%
  mgmtFeeBps: 0, // fees 0% at launch
  perfFeeBps: 0,
  vaultAccount: "floorline-demo.near",
  escrowAccount: "floor.vault-demo.near",
  treasuryAccount: "treasury.floorline-demo.near",
} as const;

export const QUOTE_DECIMALS = 6; // USDC

/* ─── Risk assets (venue candidates) ─── */

export interface RiskAsset {
  assetId: string;
  symbol: string;
  name: string;
  decimals: number;
  venue: "fallback-near" | "1click-rwa" | "solana-dex";
  /** Verified against the live 1Click /v0/tokens list. */
  verified: boolean;
  note: string;
}

export const RISK_ASSETS: RiskAsset[] = [
  {
    assetId: "nep141:wrap.near",
    symbol: "wNEAR",
    name: "Wrapped NEAR",
    decimals: 24,
    venue: "fallback-near",
    verified: true,
    note: "Live 1Click route",
  },
  {
    assetId: "nep141:nvdaon.omft.near",
    symbol: "ONDO",
    name: "Ondo tokenized stock (NEAR)",
    decimals: 6,
    venue: "1click-rwa",
    verified: false,
    note: "Not on 1Click yet — the equity route is roadmap",
  },
  {
    assetId: "nvda-xstock-sol",
    symbol: "NVDAx",
    name: "xStock tokenized stock (Solana)",
    decimals: 6,
    venue: "solana-dex",
    verified: false,
    note: "Route unverified — roadmap",
  },
];

export function riskAsset(assetId: string): RiskAsset {
  return RISK_ASSETS.find((a) => a.assetId === assetId) ?? RISK_ASSETS[0];
}

/* ─── Formulas — identical semantics to contracts/vault/src/math.rs ─── */

/** Structural subset the formulas need — satisfied by real on-chain positions. */
export interface PositionMoney {
  floor_amount: number;
  risk_units: number;
  realised_quote: number;
  cost_basis: number;
  de_risked: boolean;
}

/** (1)/(2): F = floor(D × ratio / 10_000); R = D − F. Floor division, always. */
export function splitDeposit(depositMicro: number, floorRatioBps: number) {
  const floorAmount = Math.floor((depositMicro * floorRatioBps) / 10_000);
  return { floorAmount, riskBudget: depositMicro - floorAmount };
}

/** (3): value of q risk units at price P, in micro-USDC. */
export function unitValueQuote(units: number, priceUsdc: number): number {
  return Math.round(units * priceUsdc * 1e6);
}

/** (4): NAV = F + unit_value(q) + realised_quote. */
export function navQuote(
  p: Pick<PositionMoney, "floor_amount" | "risk_units" | "realised_quote">,
  priceUsdc: number
): number {
  return p.floor_amount + unitValueQuote(p.risk_units, priceUsdc) + p.realised_quote;
}

/** worst_case(): F + realised_quote — the number the depositor keeps. */
export function worstCaseQuote(
  p: Pick<PositionMoney, "floor_amount" | "realised_quote">
): number {
  return p.floor_amount + p.realised_quote;
}

/** (5): cushion C = NAV − F; ≥ 0 by I1. */
export function cushionQuote(p: PositionMoney, priceUsdc: number): number {
  return navQuote(p, priceUsdc) - p.floor_amount;
}

/** (6): de_risk_triggered = cost_basis > 0 AND unit_value × 10⁴ < cost_basis × (10⁴ − trigger). Strict < — the boundary does not fire (covered by tests). */
export function deRiskTriggered(
  p: Pick<PositionMoney, "cost_basis" | "risk_units" | "de_risked">,
  priceUsdc: number,
  triggerBps: number = VAULT_CONFIG.deRiskTriggerBps
): boolean {
  if (p.cost_basis <= 0 || p.de_risked) return false;
  return (
    unitValueQuote(p.risk_units, priceUsdc) * 10_000 <
    p.cost_basis * (10_000 - triggerBps)
  );
}

/** Current drawdown of the risk bucket from cost basis, in bps (0 when flat or empty). */
export function drawdownBps(
  p: Pick<PositionMoney, "cost_basis" | "risk_units">,
  priceUsdc: number
): number {
  if (p.cost_basis <= 0 || p.risk_units <= 0) return 0;
  const value = unitValueQuote(p.risk_units, priceUsdc);
  return Math.max(0, Math.round(((p.cost_basis - value) / p.cost_basis) * 10_000));
}

/** (8): early exit payout = NAV × (10⁴ − fee) / 10⁴. */
export function earlyExitPayout(p: PositionMoney, priceUsdc: number): number {
  return Math.floor(
    (navQuote(p, priceUsdc) * (10_000 - VAULT_CONFIG.earlyExitFeeBps)) / 10_000
  );
}

/** (10): target units q* for a risk budget at price P (whole units, display). */
export function targetUnits(riskBudgetMicro: number, priceUsdc: number): number {
  return riskBudgetMicro / 1e6 / priceUsdc;
}

/** Average entry price paid for the risk bucket, in USDC. */
export function entryPriceUsdc(
  p: Pick<PositionMoney, "cost_basis" | "risk_units">
): number {
  return p.risk_units > 0 ? p.cost_basis / 1e6 / p.risk_units : 0;
}
