/**
 * keeper.ts — the keeper action logic shared by `scripts/keeper.mjs` (the
 * daemon) and `POST /api/v1/rebalance` (the HTTP trigger). Integer-only
 * BigInt math matching the contract; u128-safe JSON parsing (chain views
 * serialize u128 as bare JSON numbers — JS floats mangle 1e23).
 */
import { execFileSync } from "node:child_process";
import nacl from "tweetnacl";
import { existsSync, readFileSync } from "node:fs";

export interface KeeperAction {
  executed: boolean;
  reason?: string;
  tx?: string | null;
  detail?: string;
}

const VAULT = process.env.VAULT_CONTRACT_ID || "vault3.floorline-escrow.testnet";
const SIGNER = process.env.KEEPER_SIGNER || "floorline-escrow.testnet";
const RPC = process.env.NEAR_RPC_URL || "https://near-testnet.drpc.org";
/** Rebalance idempotency epoch: one action per position per epoch. */
const EPOCH_MS = Number(process.env.REBALANCE_EPOCH_MS || 60_000);

function envValue(name: string): string | null {
  if (process.env[name]) return process.env[name];
  for (const p of [".env.local", ".env"]) {
    if (existsSync(p)) {
      const m = readFileSync(p, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
      if (m) return m[1].trim();
    }
  }
  return null;
}

const U128_FIELDS =
  /("(?:deposit_amount|floor_amount|risk_budget|risk_units|cost_basis|realised_quote|nav_quote)":)(\d{16,})/g;

async function rpc(method: string, params: unknown): Promise<unknown> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "keeper", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error).slice(0, 200));
  return json.result;
}

async function view(contract: string, method: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const argsB64 = Buffer.from(JSON.stringify(args)).toString("base64");
  const result = (await rpc("query", {
    request_type: "call_function",
    finality: "final",
    account_id: contract,
    method_name: method,
    args_base64: argsB64,
  })) as { result: number[] };
  const raw = Buffer.from(result.result).toString().replace(U128_FIELDS, '$1"$2"');
  return JSON.parse(raw);
}

function signQuote(positionId: number, price: string, ts: number): string {
  const seedHex = envValue("ORACLE_SEED_HEX");
  if (!seedHex) throw new Error("ORACLE_SEED_HEX not set");
  const kp = nacl.sign.keyPair.fromSeed(new Uint8Array(Buffer.from(seedHex, "hex")));
  const msg = `floorline-quote:${positionId}:${price}:${ts}`;
  return Buffer.from(nacl.sign.detached(Buffer.from(msg, "utf8"), kp.secretKey)).toString("hex");
}

function submitTx(jsonArgs: Record<string, unknown>, method: string, gas: string): string | null {
  const out = execFileSync(
    "near",
    [
      "contract", "call-function", "as-transaction", VAULT, method,
      "json-args", JSON.stringify(jsonArgs),
      "prepaid-gas", gas, "attached-deposit", "0 NEAR",
      "sign-as", SIGNER, "network-config", "testnet", "sign-with-keychain", "send",
    ],
    { encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "pipe"] }
  );
  return out.match(/Transaction ID: ([A-Za-z0-9]+)/)?.[1] ?? null;
}

async function livePrices(): Promise<{ primary: string; secondary: string }> {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const [prices, equity] = await Promise.all([
    fetch(`${base}/api/prices`).then((r) => r.json()),
    fetch(`${base}/api/v1/equity-price`).then((r) => r.json()),
  ]);
  const wnear = prices.prices?.find((p: { symbol: string }) => p.symbol === "wNEAR");
  const nvda = equity.price;
  if (!wnear?.price || !nvda) throw new Error("price feeds unavailable");
  const primary = Math.floor((nvda / wnear.price) * 1e18).toString();
  // The SECONDARY feed: the 1Click-list wNEAR price applied to the risk
  // asset via its own source — an independent feed the vault cross-checks.
  const secondary = Math.floor((equity.price / wnear.price) * 1e18).toString();
  return { primary, secondary };
}

/** In-process idempotency ledger (position → last action epoch). */
const lastActionAt = new Map<string, number>();

/** Write the SECONDARY feed price to the on-chain oracle (the oracle key signs). */
async function submitOraclePrice(price: string): Promise<string | null> {
  const out = execFileSync(
    "near",
    [
      "contract", "call-function", "as-transaction", process.env.ORACLE_CONTRACT_ID || "oracle.floorline-escrow.testnet",
      "set_price", "json-args", JSON.stringify({
        asset_id: process.env.RISK_ASSET_ID || "nvda.floorline-escrow.testnet",
        price_1e18: price,
      }),
      "prepaid-gas", "15 TGas", "attached-deposit", "0 NEAR",
      "sign-as", process.env.ORACLE_ACCOUNT_ID || "nvda.floorline-escrow.testnet",
      "network-config", "testnet", "sign-with-keychain", "send",
    ],
    { encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "pipe"] }
  );
  return out.match(/Transaction ID: ([A-Za-z0-9]+)/)?.[1] ?? null;
}

export async function runKeeperAction(
  positionId: number,
  owner: string
): Promise<KeeperAction> {
  // Idempotent per (position, epoch): skip if we acted on it this epoch.
  const key = `${positionId}`;
  const last = lastActionAt.get(key) ?? 0;
  if (Date.now() - last < EPOCH_MS) {
    return { executed: false, reason: "already acted on this position within the current epoch" };
  }

  const positions = (await view(VAULT, "positions_of", { account_id: owner })) as Array<
    Record<string, unknown>
  >;
  const pos = positions.find((p) => Number(p.position_id) === positionId);
  if (!pos) {
    return { executed: false, reason: "position not found for owner" };
  }

  const state = String(pos.state);
  const riskBudget = BigInt(String(pos.risk_budget));
  const costBasis = BigInt(String(pos.cost_basis));
  const riskUnits = BigInt(String(pos.risk_units));
  const deRisked = Boolean(pos.de_risked);

  // The buy: Open positions with unspent budget get filled at the live price.
  if (state === "Open" && riskBudget > 0n) {
    const { primary: price, secondary } = await livePrices();
    await submitOraclePrice(secondary);
    const units = riskBudget / BigInt(price); // (6,24) decimal pair: target_units = R / P
    if (units <= 0n) return { executed: false, reason: "live price too high for the budget" };
    const ts = Date.now();
    const tx = submitTx(
      {
        position_id: String(positionId),
        actual_out: units.toString(),
        cost: riskBudget.toString(),
        min_out: units.toString(),
        price_1e18: price,
        quote_timestamp_ms: ts,
        quote_signature: signQuote(positionId, price, ts),
      },
      "record_buy",
      "60 TGas"
    );
    lastActionAt.set(key, Date.now());
    return { executed: true, reason: "record_buy at live price", tx };
  }

  // The de-risk rule (formula 6, single-shot I6).
  if (state === "Active" && costBasis > 0n && !deRisked && riskUnits > 0n) {
    const { primary: price, secondary } = await livePrices();
    await submitOraclePrice(secondary);
    const unitValue = riskUnits * BigInt(price);
    // unit_value × 10⁴ < cost × (10⁴ − trigger) — strict <
    const triggered = unitValue * 10_000n < costBasis * (10_000n - 5_000n);
    if (!triggered) {
      return {
        executed: false,
        reason: `de-risk not triggered (unit value ${unitValue} vs cost ${costBasis})`,
      };
    }
    const ts = Date.now();
    const tx = submitTx(
      {
        position_id: String(positionId),
        realised_quote: unitValue.toString(),
        price_1e18: price,
        quote_timestamp_ms: ts,
        quote_signature: signQuote(positionId, price, ts),
      },
      "record_de_risk",
      "60 TGas"
    );
    lastActionAt.set(key, Date.now());
    return { executed: true, reason: "de-risk fired (formula 6)", tx };
  }

  return {
    executed: false,
    reason: `no keeper action applies (state=${state}, cost=${costBasis}, de_risked=${deRisked})`,
  };
}
