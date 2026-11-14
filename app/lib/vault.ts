import { NearRpcError, viewContract } from "./near";

/**
 * Real vault reads over NEAR JSON-RPC.
 * Today the configured contract is usually not deployed yet — callers get
 * NearRpcError with the chain's real message and the UI shows that honestly.
 */

export const VAULT_CONTRACT_ID =
  process.env.VAULT_CONTRACT_ID ?? "vault3.floorline-escrow.testnet";

/** u128 values arrive as strings from the contract; normalize to numbers. */
function u128(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    return Number(BigInt(v.slice(0, 30))); // display precision is enough for f64 UI math
  }
  return 0;
}

function nsToMs(ns: unknown): number {
  const n = typeof ns === "number" ? ns : Number(ns ?? 0);
  return n > 0 ? Math.round(n / 1_000_000) : 0;
}

const STATE_MAP: Record<string, string> = {
  Open: "open",
  Active: "active",
  DeRisked: "derisked",
  Matured: "matured",
  Settled: "settled",
  Degraded: "degraded",
};

export interface RawPosition {
  owner?: string;
  deposit_amount?: unknown;
  floor_amount?: unknown;
  risk_units?: unknown;
  cost_basis?: unknown;
  realised_quote?: unknown;
  de_risked?: boolean;
  opened_at?: unknown;
  matures_at?: unknown;
  state?: string;
  risk_asset_id?: string;
}

export interface VaultPosition {
  id: number;
  owner: string;
  risk_asset_id: string;
  deposit_amount: number;
  floor_amount: number;
  risk_budget: number;
  risk_units: number;
  cost_basis: number;
  realised_quote: number;
  de_risked: boolean;
  opened_at: number;
  matures_at: number;
  state: string;
}

export function mapPosition(id: number, raw: RawPosition): VaultPosition {
  const deposit = u128(raw.deposit_amount);
  const floor = u128(raw.floor_amount);
  return {
    id,
    owner: raw.owner ?? "",
    risk_asset_id: raw.risk_asset_id ?? "nep141:wrap.near",
    deposit_amount: deposit,
    floor_amount: floor,
    risk_budget: Math.max(0, deposit - floor),
    risk_units: Number(raw.risk_units ?? 0),
    cost_basis: u128(raw.cost_basis),
    realised_quote: u128(raw.realised_quote),
    de_risked: Boolean(raw.de_risked),
    opened_at: nsToMs(raw.opened_at),
    matures_at: nsToMs(raw.matures_at),
    state:
      STATE_MAP[raw.state ?? ""] ?? (String(raw.state ?? "").toLowerCase() || "open"),
  };
}

/** `positions_of(account)` → full positions. */
export async function fetchPositions(accountId: string): Promise<VaultPosition[]> {
  const ids = await viewContract<Array<number | string>>(
    VAULT_CONTRACT_ID,
    "positions_of",
    { account_id: accountId },
  );
  const positions = await Promise.all(
    ids.map(async (rawId) => {
      const id = typeof rawId === "string" ? Number(rawId) : rawId;
      const raw = await viewContract<RawPosition | null>(VAULT_CONTRACT_ID, "get_position", {
        position_id: String(id),
      });
      return mapPosition(id, raw ?? ({} as RawPosition));
    }),
  );
  return positions;
}

/** `get_position(id)` → one position. */
export async function fetchPosition(id: number): Promise<VaultPosition | null> {
  const raw = await viewContract<RawPosition | null>(VAULT_CONTRACT_ID, "get_position", {
    position_id: String(id),
  });
  return raw ? mapPosition(id, raw) : null;
}

export function isNotDeployed(err: unknown): boolean {
  return (
    err instanceof NearRpcError &&
    (err.message.includes("does not exist on NEAR mainnet") ||
      err.message.includes("MethodNotFound"))
  );
}
