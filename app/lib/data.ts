/**
 * Fixed epoch for all mock timestamps (2026-11-12T06:00:00Z).
 * Module-scope Date.now() calls render differently on server and
 * client and break hydration; constants render identically.
 * Live adapters will replace these fixtures via fetch/effects.
 */
export const MOCK_EPOCH = Date.UTC(2026, 10, 12, 6, 0, 0);

export type PositionState =
  | "created"
  | "funding"
  | "buying"
  | "active"
  | "selling"
  | "closed"
  | "withdrawn"
  | "refunding";

export interface Policy {
  stop_loss_bps: number;
  take_profit_bps: number;
  tp_sell_bps: number;
  dca_amount_usdc: number;
  dca_interval_s: number;
  max_slippage_bps: number;
}

export const DEFAULT_POLICY: Policy = {
  stop_loss_bps: 900,
  take_profit_bps: 2500,
  tp_sell_bps: 5000,
  dca_amount_usdc: 10_000_000,
  dca_interval_s: 604_800,
  max_slippage_bps: 100,
};

export interface Position {
  id: number;
  /** Hex identifier shown in URLs and UI, e.g. 0x2b9e…8e3b. */
  hex_id: string;
  owner: string;
  nft_token_id: string;
  sol_path: string;
  derived_sol: string;
  state: PositionState;
  usdc_in: number;
  nvdax_amount: number;
  entry_px: number;
  policy: Policy;
  last_dca_ns: number;
  in_flight?: { action: string; started_at: number } | null;
}

export interface AuditEntry {
  ts: number;
  position_id: number;
  action: string;
  quote_hash: string;
  tx_sig?: string;
  signer_request_id?: string;
}

export interface Ticker {
  symbol: string;
  sol_mint: string;
  decimals: number;
  min_usdc: number;
  name: string;
  price_usdc: number;
  change_24h: number;
}

export const NVDA_TICKER: Ticker = {
  symbol: "NVDAx",
  sol_mint: "3dQ5…mVXB",
  decimals: 6,
  min_usdc: 1_000_000,
  name: "NVIDIA xStock",
  price_usdc: 13.42,
  change_24h: 0.0234,
};

export const MOCK_POSITIONS: Position[] = [
  {
    id: 1,
    hex_id: "0x8f3a1c42e7b8d05a6c1f24b8e3d9f0a7",
    owner: "priya.near",
    nft_token_id: "pos-1",
    sol_path: "pos-1",
    derived_sol: "7xKX3zQoHj2mVXBqL9pR4sT5nUvW8yZaBcDeFgHiJkLm",
    state: "active",
    usdc_in: 10_000_000,
    nvdax_amount: 744_783,
    entry_px: 13_426_500,
    policy: DEFAULT_POLICY,
    last_dca_ns: MOCK_EPOCH * 1_000_000,
    in_flight: null,
  },
  {
    id: 2,
    hex_id: "0x2b9e6f41d3c78a5f0e4b2c9d7a1f8e3b",
    owner: "priya.near",
    nft_token_id: "pos-2",
    sol_path: "pos-2",
    derived_sol: "9yMZ5aRpKj4nTXCqP7sR6uV9xWbYcDeFgHiJkLmNoPqR",
    state: "closed",
    usdc_in: 25_000_000,
    nvdax_amount: 1_860_000,
    entry_px: 13_405_000,
    policy: { ...DEFAULT_POLICY, stop_loss_bps: 700 },
    last_dca_ns: MOCK_EPOCH * 1_000_000,
    in_flight: null,
  },
];

export const AUDIT_LOG: AuditEntry[] = [
  {
    ts: MOCK_EPOCH - 1000 * 60 * 60 * 2,
    position_id: 1,
    action: "Bought",
    quote_hash: "a1b2c3d4",
    tx_sig: "5KtL…xYz9",
    signer_request_id: "req-001",
  },
  {
    ts: MOCK_EPOCH - 1000 * 60 * 60 * 1,
    position_id: 1,
    action: "PriceUpdate",
    quote_hash: "e5f6g7h8",
  },
  {
    ts: MOCK_EPOCH - 1000 * 60 * 30,
    position_id: 2,
    action: "StopExecuted",
    quote_hash: "i9j0k1l2",
    tx_sig: "3FmN…qRs7",
    signer_request_id: "req-002",
  },
];

export interface Quote {
  src: "1click" | "jupiter";
  amount_in: number;
  amount_out: number;
  fee_bps: number;
  price_impact_bps: number;
  expires_at_ns: number;
  raw: string;
}

export function generateMockQuote(amountUsdc: number): Quote {
  return {
    src: "1click",
    amount_in: Math.round(amountUsdc * 1e6),
    amount_out: Math.floor((amountUsdc / NVDA_TICKER.price_usdc) * 1e6),
    fee_bps: 25,
    price_impact_bps: 8,
    expires_at_ns: (MOCK_EPOCH + 60_000) * 1_000_000,
    raw: "mock-quote-payload",
  };
}

/* ─── Dashboard fixtures ─── */

export const PORTFOLIO_HISTORY = [
  { date: "Oct 14", value: 9.12 },
  { date: "Oct 15", value: 9.03 },
  { date: "Oct 16", value: 9.21 },
  { date: "Oct 17", value: 9.48 },
  { date: "Oct 20", value: 9.36 },
  { date: "Oct 21", value: 9.72 },
  { date: "Oct 22", value: 10.05 },
  { date: "Oct 23", value: 9.98 },
  { date: "Oct 24", value: 10.31 },
  { date: "Oct 27", value: 10.62 },
  { date: "Oct 28", value: 10.44 },
  { date: "Oct 29", value: 10.87 },
  { date: "Oct 30", value: 11.12 },
  { date: "Oct 31", value: 10.95 },
  { date: "Nov 3", value: 11.31 },
  { date: "Nov 4", value: 11.58 },
  { date: "Nov 5", value: 11.4 },
  { date: "Nov 6", value: 11.74 },
  { date: "Nov 7", value: 11.52 },
  { date: "Nov 10", value: 11.89 },
  { date: "Nov 11", value: 11.76 },
  { date: "Nov 12", value: 11.84 },
];

export const RECENT_ACTIVITY: AuditEntry[] = [
  {
    ts: MOCK_EPOCH - 1000 * 60 * 12,
    position_id: 1,
    action: "PriceUpdate",
    quote_hash: "k3m4n5o6",
  },
  {
    ts: MOCK_EPOCH - 1000 * 60 * 60 * 3,
    position_id: 1,
    action: "DcaExecuted",
    quote_hash: "p7q8r9s0",
    tx_sig: "8HjK…tUv2",
    signer_request_id: "req-011",
  },
  {
    ts: MOCK_EPOCH - 1000 * 60 * 60 * 26,
    position_id: 2,
    action: "StopExecuted",
    quote_hash: "t1u2v3w4",
    tx_sig: "3FmN…qRs7",
    signer_request_id: "req-009",
  },
  {
    ts: MOCK_EPOCH - 1000 * 60 * 60 * 49,
    position_id: 1,
    action: "Bought",
    quote_hash: "x5y6z7a8",
    tx_sig: "5KtL…xYz9",
    signer_request_id: "req-005",
  },
];

/* ─── Deterministic policy simulator ─── */

export interface SimulationResult {
  dates: string[];
  equity: number[];
  buyHold: number[];
  metrics: {
    cagr_pct: number;
    max_drawdown_bps: number;
    stops_triggered: number;
    tps_triggered: number;
    final_value_usdc: number;
    vs_buy_hold_bps: number;
  };
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Byte-identical output for identical (policy, seed) — spec §0.6. */
export function generateSimulation(policy: Policy, seed = 42): SimulationResult {
  const rand = seededRandom(seed);
  const days = 252;
  const dates: string[] = [];
  const equity: number[] = [];
  const buyHold: number[] = [];

  let price = 13.0;
  let cash = 100;
  let shares = 0;
  const buyHoldShares = 100 / price;
  let peak = 100;
  let maxDD = 0;
  let stops = 0;
  let tps = 0;
  const entryPx = price;

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.UTC(2025, 0, 2 + i));
    dates.push(date.toISOString().split("T")[0]);

    const drift = (rand() - 0.48) * 0.04;
    price = Math.max(1, price * (1 + drift));

    // Weekly DCA every 30 sessions
    if (i > 0 && i % 30 === 0 && cash >= 10) {
      shares += 10 / price;
      cash -= 10;
    }

    const value = shares * price + cash;
    const buyHoldValue = buyHoldShares * price;

    // Stop loss — full exit
    if (price <= entryPx * (1 - policy.stop_loss_bps / 10000) && shares > 0) {
      cash += shares * price;
      shares = 0;
      stops++;
    }

    // Take profit — partial sell
    if (price >= entryPx * (1 + policy.take_profit_bps / 10000) && shares > 0) {
      const sellShares = (shares * policy.tp_sell_bps) / 10000;
      cash += sellShares * price;
      shares -= sellShares;
      tps++;
    }

    peak = Math.max(peak, value);
    maxDD = Math.max(maxDD, (peak - value) / peak);

    equity.push(value);
    buyHold.push(buyHoldValue);
  }

  const finalValue = shares * price + cash;
  const buyHoldFinal = buyHoldShares * price;

  return {
    dates,
    equity,
    buyHold,
    metrics: {
      cagr_pct: (Math.pow(finalValue / 100, 1) - 1) * 100,
      max_drawdown_bps: Math.round(maxDD * 10000),
      stops_triggered: stops,
      tps_triggered: tps,
      final_value_usdc: finalValue,
      vs_buy_hold_bps: Math.round(((finalValue - buyHoldFinal) / buyHoldFinal) * 10000),
    },
  };
}
