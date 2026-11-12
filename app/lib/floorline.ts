/**
 * Floorline core — single source of truth for the web app.
 * Spec: agent/Agent.md §4 (objects, formulas, invariants), §16 (env defaults).
 *
 * All money math here is f64 and display-only (§4.5 allows this for display;
 * on-chain math is u128 with checked ops in contracts/vault/src/math.rs).
 * Quote amounts are micro-USDC (1e6 = $1.00), matching the 6-decimal quote asset.
 */

/* ─── Vault config (§4.1 VaultConfig defaults) ─── */

export const VAULT_CONFIG = {
  quoteAssetId:
    "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1" as const, // USDC on NEAR, 6 dec
  riskAssetId: "nep141:wrap.near" as const, // wNEAR, 24 dec — verified fallback (G-2)
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
  mgmtFeeBps: 0, // fees off for the hackathon build
  perfFeeBps: 0,
  vaultAccount: "floorline-demo.near",
  escrowAccount: "floor.vault-demo.near",
  treasuryAccount: "treasury.floorline-demo.near",
} as const;

export const QUOTE_DECIMALS = 6; // USDC

/* ─── Risk assets (§8.3 candidates, G-2 gate) ─── */

export interface RiskAsset {
  assetId: string;
  symbol: string;
  name: string;
  decimals: number;
  venue: "fallback-near" | "1click-rwa" | "solana-dex";
  /** Verified against 1Click /v0/tokens on 12 Nov 2026. */
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
    note: "Verified 1Click route — the demo asset",
  },
  {
    assetId: "nep141:nvdaon.omft.near",
    symbol: "NVDAon",
    name: "NVIDIA (Ondo on NEAR)",
    decimals: 6,
    venue: "1click-rwa",
    verified: false,
    note: "Not on 1Click yet — the equity wedge is roadmap (G-2)",
  },
  {
    assetId: "nvda-xstock-sol",
    symbol: "NVDAx",
    name: "NVIDIA xStock (Solana)",
    decimals: 6,
    venue: "solana-dex",
    verified: false,
    note: "Route unverified from the build environment (G-2)",
  },
];

export function riskAsset(assetId: string): RiskAsset {
  return RISK_ASSETS.find((a) => a.assetId === assetId) ?? RISK_ASSETS[0];
}

/** Current risk-asset price in USDC (mock oracle tick; production reads the keeper's /v1/quote). */
export const RISK_PRICE_USDC = 3.85;

/* ─── Positions (§4.1) ─── */

export type FloorlineState =
  | "open"
  | "active"
  | "derisked"
  | "matured"
  | "settled"
  | "degraded";

export interface FloorlinePosition {
  id: number;
  /** Opaque URL id (on-chain token_id is a numeric u64; URLs use hex). */
  hex_id: string;
  owner: string;
  risk_asset_id: string;
  /** Micro-USDC (1e6 = $1.00). */
  deposit_amount: number;
  floor_amount: number;
  risk_budget: number;
  /** Whole risk-asset units held (display precision). */
  risk_units: number;
  /** Micro-USDC spent acquiring risk_units. */
  cost_basis: number;
  /** Micro-USDC already returned by a de-risk sale. */
  realised_quote: number;
  de_risked: boolean;
  /** ms epoch. */
  opened_at: number;
  matures_at: number;
  state: FloorlineState;
}

/* ─── Formulas (§4.2) — copy-verbatim semantics ─── */

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
export function navQuote(p: FloorlinePosition, priceUsdc: number): number {
  return p.floor_amount + unitValueQuote(p.risk_units, priceUsdc) + p.realised_quote;
}

/** §6.2 worst_case(): F + realised_quote — the number the depositor keeps. */
export function worstCaseQuote(p: FloorlinePosition): number {
  return p.floor_amount + p.realised_quote;
}

/** (5): cushion C = NAV − F; ≥ 0 by I1. */
export function cushionQuote(p: FloorlinePosition, priceUsdc: number): number {
  return navQuote(p, priceUsdc) - p.floor_amount;
}

/** (6): de_risk_triggered = cost_basis > 0 AND unit_value × 10⁴ < cost_basis × (10⁴ − trigger). Strict < — the boundary does not fire (§4.7 #3). */
export function deRiskTriggered(
  p: Pick<FloorlinePosition, "cost_basis" | "risk_units" | "de_risked">,
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
  p: Pick<FloorlinePosition, "cost_basis" | "risk_units">,
  priceUsdc: number
): number {
  if (p.cost_basis <= 0 || p.risk_units <= 0) return 0;
  const value = unitValueQuote(p.risk_units, priceUsdc);
  return Math.max(0, Math.round(((p.cost_basis - value) / p.cost_basis) * 10_000));
}

/** (8): early exit payout = NAV × (10⁴ − fee) / 10⁴. */
export function earlyExitPayout(p: FloorlinePosition, priceUsdc: number): number {
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
  p: Pick<FloorlinePosition, "cost_basis" | "risk_units">
): number {
  return p.risk_units > 0 ? p.cost_basis / 1e6 / p.risk_units : 0;
}

/* ─── Golden vector (§4.5) — identical numbers in the Rust and TS suites ─── */

export const GOLDEN_VECTOR = {
  deposit: 1_000_000_000, // 1,000.000000 USDC
  floorRatioBps: 9_000,
  floorAmount: 900_000_000,
  riskBudget: 100_000_000,
  priceUsdc: 3.58, // wNEAR, 12 Nov
  targetUnits: 27.932960893854748, // ≈ 27.932960893854748 wNEAR
} as const;

/* ─── Portfolio fixtures ─── */

/** Total NAV across the demo portfolio, USD, most recent last (dashboard chart). */
export const NAV_HISTORY = [
  { date: "Oct 14", value: 912 },
  { date: "Oct 15", value: 903 },
  { date: "Oct 16", value: 921 },
  { date: "Oct 17", value: 948 },
  { date: "Oct 20", value: 936 },
  { date: "Oct 21", value: 972 },
  { date: "Oct 22", value: 1005 },
  { date: "Oct 23", value: 998 },
  { date: "Oct 24", value: 1031 },
  { date: "Oct 27", value: 1062 },
  { date: "Oct 28", value: 1044 },
  { date: "Oct 29", value: 1087 },
  { date: "Oct 30", value: 1112 },
  { date: "Oct 31", value: 1095 },
  { date: "Nov 3", value: 1131 },
  { date: "Nov 4", value: 1158 },
  { date: "Nov 5", value: 1140 },
  { date: "Nov 6", value: 1174 },
  { date: "Nov 7", value: 1152 },
  { date: "Nov 10", value: 1189 },
  { date: "Nov 11", value: 1176 },
  { date: "Nov 12", value: 1184 },
];

const MINUTE = 60_000;
const HOUR = 3_600_000;
export const DAY = 86_400_000;
/** Fixed "now" for every fixture — keeps server and client renders identical. */
export const MOCK_EPOCH = Date.UTC(2026, 10, 12, 6, 0, 0);

export const MOCK_POSITIONS: FloorlinePosition[] = [
  {
    // Active — bought at $3.58 per the golden vector, wNEAR now $3.85
    id: 1,
    hex_id: "0x8f3a1c42e7b8d05a6c1f24b8e3d9f0a7",
    owner: "priya.near",
    risk_asset_id: "nep141:wrap.near",
    deposit_amount: 1_000_000_000,
    floor_amount: 900_000_000,
    risk_budget: 100_000_000,
    risk_units: 27.932960893854748,
    cost_basis: 100_000_000,
    realised_quote: 0,
    de_risked: false,
    opened_at: MOCK_EPOCH - 49 * HOUR,
    matures_at: MOCK_EPOCH - 49 * HOUR + 30 * DAY,
    state: "active",
  },
  {
    // DeRisked — bucket sold at a −52% drawdown; loss halved, now locked
    id: 2,
    hex_id: "0x2b9e6f41d3c78a5f0e4b2c9d7a1f8e3b",
    owner: "priya.near",
    risk_asset_id: "nep141:wrap.near",
    deposit_amount: 500_000_000,
    floor_amount: 450_000_000,
    risk_budget: 50_000_000,
    risk_units: 0,
    cost_basis: 50_000_000,
    realised_quote: 24_000_000,
    de_risked: true,
    opened_at: MOCK_EPOCH - 12 * DAY,
    matures_at: MOCK_EPOCH - 12 * DAY + 30 * DAY,
    state: "derisked",
  },
  {
    // Matured — term reached, awaiting settle
    id: 3,
    hex_id: "0x4d7a91b5e2c8f036a7d1b4e9c5f2a8d3",
    owner: "priya.near",
    risk_asset_id: "nep141:wrap.near",
    deposit_amount: 250_000_000,
    floor_amount: 225_000_000,
    risk_budget: 25_000_000,
    risk_units: 6.977653631284916, // 25 USDC at $3.58 entry
    cost_basis: 25_000_000,
    realised_quote: 0,
    de_risked: false,
    opened_at: MOCK_EPOCH - 32 * DAY,
    matures_at: MOCK_EPOCH - 2 * DAY,
    state: "matured",
  },
  {
    // Open — funded, first buy still settling through 1Click
    id: 4,
    hex_id: "0x6b2e5f8a1d4c7e90b3f6a2d5c8e1f4a7",
    owner: "priya.near",
    risk_asset_id: "nep141:wrap.near",
    deposit_amount: 50_000_000,
    floor_amount: 45_000_000,
    risk_budget: 5_000_000,
    risk_units: 0,
    cost_basis: 0,
    realised_quote: 0,
    de_risked: false,
    opened_at: MOCK_EPOCH - 8 * MINUTE,
    matures_at: MOCK_EPOCH - 8 * MINUTE + 30 * DAY,
    state: "open",
  },
  {
    // Degraded — venue stuck past settlement_timeout; emergency_recover available
    id: 5,
    hex_id: "0x9c1f4b7e2a5d8c30f6e9b2a4d7c1e5f8",
    owner: "priya.near",
    risk_asset_id: "nep141:wrap.near",
    deposit_amount: 100_000_000,
    floor_amount: 90_000_000,
    risk_budget: 10_000_000,
    risk_units: 0,
    cost_basis: 0,
    realised_quote: 0,
    de_risked: false,
    opened_at: MOCK_EPOCH - 26 * HOUR,
    matures_at: MOCK_EPOCH - 26 * HOUR + 30 * DAY,
    state: "degraded",
  },
];

/* ─── Vault events (§6.2 event list) ─── */

export type VaultEventName =
  | "Deposited"
  | "ReserveEscrowed"
  | "BuyAuthorized"
  | "BuySettled"
  | "DeRiskTriggered"
  | "DeRiskSettled"
  | "PositionSettled"
  | "PositionDegraded"
  | "PositionTransferred"
  | "PausedSet";

export interface VaultEvent {
  ts: number;
  position_id: number;
  name: VaultEventName;
  detail: string;
  tx?: string;
}

export const VAULT_EVENTS: VaultEvent[] = [
  {
    ts: MOCK_EPOCH - 49 * HOUR + 47 * MINUTE,
    position_id: 1,
    name: "BuySettled",
    detail: "27.932960 wNEAR in · slippage 8 bps",
    tx: "5KtL8mQ4xYz9pHnV2rWs7bKd3eFa9cUv1oJiGkLm",
  },
  {
    ts: MOCK_EPOCH - 49 * HOUR + 43 * MINUTE,
    position_id: 1,
    name: "BuyAuthorized",
    detail: "100.00 USDC risk budget · min out 27.62 wNEAR",
  },
  {
    ts: MOCK_EPOCH - 49 * HOUR + 2 * MINUTE,
    position_id: 1,
    name: "ReserveEscrowed",
    detail: "900.00 USDC → floor.vault-demo.near",
    tx: "7RpW2nBt9cKe5mFa1uXv8dJi3gQz6oLk4sHbNmEa",
  },
  {
    ts: MOCK_EPOCH - 49 * HOUR,
    position_id: 1,
    name: "Deposited",
    detail: "1,000.00 USDC from Base via 1Click",
    tx: "3FmN9xQs7tRb6kVc2wYd5eHj8pUa4oLi1gZfCmWn",
  },
  {
    ts: MOCK_EPOCH - 12 * DAY + 2 * DAY - 3 * HOUR,
    position_id: 2,
    name: "DeRiskSettled",
    detail: "24.00 USDC realised · bucket closed",
    tx: "8HjK3tUv2mNr7wXq5bPd9eFs1aCo6gLi4kZtRhWm",
  },
  {
    ts: MOCK_EPOCH - 12 * DAY + 2 * DAY - 3 * HOUR - 20 * MINUTE,
    position_id: 2,
    name: "DeRiskTriggered",
    detail: "Drawdown 52.0% crossed the −50% trigger",
  },
  {
    ts: MOCK_EPOCH - 12 * DAY + 2 * DAY,
    position_id: 2,
    name: "BuySettled",
    detail: "13.966480 wNEAR in · slippage 11 bps",
    tx: "2WqA6rYd8nFt4kPv1bSe9gUo3cJi7mZl5xHnEdRf",
  },
  {
    ts: MOCK_EPOCH - 12 * DAY + 1 * DAY + 23 * HOUR,
    position_id: 2,
    name: "BuyAuthorized",
    detail: "50.00 USDC risk budget · min out 13.62 wNEAR",
  },
  {
    ts: MOCK_EPOCH - 12 * DAY + 1 * DAY + 21 * HOUR,
    position_id: 2,
    name: "ReserveEscrowed",
    detail: "450.00 USDC → floor.vault-demo.near",
    tx: "9cKe4mFa2wXv7dJi1pUb6tRs3oNg5zLf8aHbQmEd",
  },
  {
    ts: MOCK_EPOCH - 12 * DAY + 1 * DAY + 20 * HOUR,
    position_id: 2,
    name: "Deposited",
    detail: "500.00 USDC from Arbitrum via 1Click",
    tx: "4tRs7oNg1zKf9mWb3pUd6aHe2xJi8cLl5vFnQmEb",
  },
  {
    ts: MOCK_EPOCH - 32 * DAY + 4 * HOUR,
    position_id: 3,
    name: "BuySettled",
    detail: "6.977653 wNEAR in · slippage 6 bps",
    tx: "6nFt9kPv2bSg3aUo7dJe1mZl4xWq8cHr5vEdRiNf",
  },
  {
    ts: MOCK_EPOCH - 32 * DAY + 3 * HOUR,
    position_id: 3,
    name: "BuyAuthorized",
    detail: "25.00 USDC risk budget · min out 6.84 wNEAR",
  },
  {
    ts: MOCK_EPOCH - 32 * DAY + 2 * HOUR,
    position_id: 3,
    name: "ReserveEscrowed",
    detail: "225.00 USDC → floor.vault-demo.near",
    tx: "1bSg4aUo9dJw2mZk6xVr3nHt7cFe5pLq8iRmWfEd",
  },
  {
    ts: MOCK_EPOCH - 32 * DAY,
    position_id: 3,
    name: "Deposited",
    detail: "250.00 USDC from Polygon via 1Click",
    tx: "7dJw1mZk4xVr9nHt2cFe6pLq3iRo8aWb5vEdRgNf",
  },
  {
    ts: MOCK_EPOCH - 8 * MINUTE,
    position_id: 4,
    name: "Deposited",
    detail: "50.00 USDC from Optimism via 1Click",
    tx: "2mZk8xVr4nHt6cFe1pLq9iRo3aWb7vEd5gNfRdJw",
  },
  {
    ts: MOCK_EPOCH - 8 * MINUTE + 30_000,
    position_id: 4,
    name: "ReserveEscrowed",
    detail: "45.00 USDC → floor.vault-demo.near",
  },
  {
    ts: MOCK_EPOCH - 26 * HOUR - 18 * MINUTE,
    position_id: 5,
    name: "PositionDegraded",
    detail: "No SUCCESS past settlement_timeout (20 min) — venue unavailable",
  },
  {
    ts: MOCK_EPOCH - 26 * HOUR - 40 * MINUTE,
    position_id: 5,
    name: "BuyAuthorized",
    detail: "10.00 USDC risk budget · deposit 0x742d…bEb",
  },
  {
    ts: MOCK_EPOCH - 26 * HOUR - 42 * MINUTE,
    position_id: 5,
    name: "ReserveEscrowed",
    detail: "90.00 USDC → floor.vault-demo.near",
    tx: "5xVr2nHt8cFe4pLq1iRo9aWb3vEd7gNfRdJw6mZk",
  },
  {
    ts: MOCK_EPOCH - 26 * HOUR - 43 * MINUTE,
    position_id: 5,
    name: "Deposited",
    detail: "100.00 USDC from Solana via 1Click",
    tx: "3cFe7pLq2iRo5aWb8vEd1gNf9rJw4mZk6xVtHnDf",
  },
];

export function eventsFor(positionId: number): VaultEvent[] {
  return VAULT_EVENTS.filter((e) => e.position_id === positionId).sort(
    (a, b) => b.ts - a.ts
  );
}
