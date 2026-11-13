#!/usr/bin/env node
/**
 * keeper.mjs — the Floorline keeper loop (Agent.md §6.3, F-10/F-11).
 *
 * Real automation, no human in the loop:
 *   1. Polls tracked accounts' positions on-chain (RPC).
 *   2. Fetches live prices (Yahoo equity feed + 1Click wNEAR).
 *   3. For every Open position with an unspent risk budget: signs a quote
 *      with the oracle key and records the buy on-chain.
 *   4. For every Active position whose bucket fell below the de-risk
 *      trigger (formula 6): signs and records the de-risk.
 *   5. Everything is idempotent against on-chain state: an already-bought
 *      position is skipped; the de-risked latch makes a second sale revert.
 *
 * Signing: quotes are signed with ORACLE_SEED_HEX (tweetnacl); transactions
 * are submitted through the `near` CLI with the keychain key — the seed and
 * the spending key never enter git. Settlement and early exit remain
 * owner-signed (their money).
 *
 * Usage:  node scripts/keeper.mjs [--once] [--accounts a.testnet,b.testnet]
 * Env:    VAULT_CONTRACT_ID, ORACLE_SEED_HEX, KEEPER_SIGNER (default
 *         floorline-escrow.testnet), KEEPER_INTERVAL_SEC (default 60)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const RPC = process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org";
const VAULT = process.env.VAULT_CONTRACT_ID || "vault3.floorline-escrow.testnet";
const QUOTE = "wrap.testnet";
const SIGNER = process.env.KEEPER_SIGNER || "floorline-escrow.testnet";
const INTERVAL = Number(process.env.KEEPER_INTERVAL_SEC || 60);

function envValue(name) {
  if (process.env[name]) return process.env[name];
  for (const p of [".env.local", ".env"]) {
    if (existsSync(p)) {
      const m = readFileSync(p, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
      if (m) return m[1].trim();
    }
  }
  return null;
}

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "keeper", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error).slice(0, 200));
  return json.result;
}

const U128_FIELDS =
  /("(?:deposit_amount|floor_amount|risk_budget|risk_units|cost_basis|realised_quote|nav_quote|amount_in|amount_out)":)(\d{16,})/g;

async function view(contract, method, args = {}) {
  const argsB64 = Buffer.from(JSON.stringify(args)).toString("base64");
  const result = await rpc("query", {
    request_type: "call_function",
    finality: "final",
    account_id: contract,
    method_name: method,
    args_base64: argsB64,
  });
  // u128 amounts arrive as bare JSON numbers — JS floats mangle them
  // (1e23 → "1e+23"). Quote them BEFORE parsing so BigInt math stays exact.
  const raw = Buffer.from(result.result).toString().replace(U128_FIELDS, '$1"$2"');
  return JSON.parse(raw);
}

function nearCliArgs(jsonArgs, method, account, gas = "30 TGas") {
  return [
    "contract", "call-function", "as-transaction", VAULT, method,
    "json-args", JSON.stringify(jsonArgs),
    "prepaid-gas", gas, "attached-deposit", "0 NEAR",
    "sign-as", account, "network-config", "testnet", "sign-with-keychain", "send",
  ];
}

function submitTx(jsonArgs, method, account, gas) {
  const out = execFileSync("near", nearCliArgs(jsonArgs, method, account, gas), {
    encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "pipe"],
  });
  const m = out.match(/Transaction ID: ([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

async function livePrice1e18() {
  // Primary: 1Click wNEAR USD (the quote asset). Secondary: Yahoo NVDA USD.
  const [prices, equity] = await Promise.all([
    fetch("http://localhost:3000/api/prices").then((r) => r.json()),
    fetch("http://localhost:3000/api/v1/equity-price").then((r) => r.json()),
  ]);
  const wnear = prices.prices.find((p) => p.symbol === "wNEAR");
  const nvda = equity.price;
  if (!wnear?.price || !nvda) throw new Error("price feeds unavailable");
  // P_1e18 = whole-quote (wNEAR) per whole-risk (NVDA), scaled 1e18.
  return { price: Math.floor((nvda / wnear.price) * 1e18), nvda, wnear: wnear.price };
}

// The vault's math for the (6, 24) decimal pair — integer-only, as on-chain:
// target units = floor(cost / P); unit value = units × P.
const targetUnits = (riskBudget, price1e18) =>
  (BigInt(riskBudget) / BigInt(price1e18)).toString();
const unitValue = (units, price1e18) => (BigInt(units) * BigInt(price1e18)).toString();
const deRiskTriggered = (unitValueQuote, costBasis, deRisked, triggerBps) =>
  costBasis > 0 && !deRisked && unitValueQuote * 10_000 < costBasis * (10_000 - triggerBps);

async function tick(accounts, log) {
  const { price, nvda, wnear } = await livePrice1e18();
  log(`prices: NVDA $${nvda} · wNEAR $${wnear} · P=${price}`);
  const actions = [];

  for (const account of accounts) {
    let positions = [];
    try {
      positions = await view(VAULT, "positions_of", { account_id: account });
    } catch (e) {
      log(`! ${account}: ${e.message}`);
      continue;
    }
    for (const pos of positions) {
      const pid = pos.position_id;

      // 3. The buy: Open positions with unspent budget get filled at the
      // live price. Signed quote; the contract enforces the rest.
      if (pos.state === "Open" && pos.risk_budget > 0) {
        const units = targetUnits(pos.risk_budget, price);
        if (units > 0) {
          const ts = Date.now();
          const sig = signQuote(pid, price, ts);
          try {
            const tx = submitTx(
              {
                position_id: String(pid), actual_out: String(units),
                cost: String(pos.risk_budget), min_out: String(units),
                price_1e18: String(price), quote_timestamp_ms: ts,
                quote_signature: sig,
              },
              "record_buy", SIGNER
            );
            log(`✓ buy recorded for position ${pid} (${units} units) tx=${tx}`);
            actions.push({ action: "record_buy", position: pid, tx });
          } catch (e) {
            log(`! record_buy ${pid}: ${String(e).slice(0, 300)}`);
          }
          continue; // one action per position per tick
        }
      }

      // 4. The de-risk rule (formula 6), single-shot on-chain (I6).
      if (pos.state === "Active" && pos.cost_basis > 0 && !pos.de_risked) {
        const value = unitValue(pos.risk_units, price);
        if (deRiskTriggered(value, pos.cost_basis, pos.de_risked, 5000)) {
          const ts = Date.now();
          const sig = signQuote(pid, price, ts);
          try {
            const tx = submitTx(
              {
                position_id: String(pid), realised_quote: String(value),
                price_1e18: String(price), quote_timestamp_ms: ts,
                quote_signature: sig,
              },
              "record_de_risk", SIGNER
            );
            log(`✓ de-risk recorded for position ${pid} (value ${value}) tx=${tx}`);
            actions.push({ action: "record_de_risk", position: pid, tx });
          } catch (e) {
            log(`! record_de_risk ${pid}: ${String(e).slice(0, 160)}`);
          }
        } else {
          log(`· position ${pid}: de-risk not triggered (value ${value} vs cost ${pos.cost_basis})`);
        }
      }
    }
  }
  return actions;
}

function signQuote(positionId, price, ts) {
  const seed = Buffer.from(envValue("ORACLE_SEED_HEX"), "hex");
  const nacl = require("tweetnacl");
  const kp = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
  const msg = `floorline-quote:${positionId}:${price}:${ts}`;
  return Buffer.from(nacl.sign.detached(Buffer.from(msg, "utf8"), kp.secretKey)).toString("hex");
}


const args = process.argv.slice(2);
const once = args.includes("--once");
const accountsArg = args.find((a) => a.startsWith("--accounts"));
const accounts = accountsArg
  ? accountsArg.split("=")[1].split(",")
  : [SIGNER];
const log = (m) => console.log(`[keeper ${new Date().toISOString()}] ${m}`);

log(`keeper start: vault=${VAULT} signer=${SIGNER} accounts=${accounts.join(",")}`);
if (once) {
  const actions = await tick(accounts, log);
  log(once ? `done: ${actions.length} action(s)` : "tick complete");
  process.exit(0);
}
for (;;) {
  try {
    await tick(accounts, log);
  } catch (e) {
    log(`! tick error: ${String(e).slice(0, 200)}`);
  }
  await new Promise((r) => setTimeout(r, INTERVAL * 1000));
}
