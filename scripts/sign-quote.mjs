#!/usr/bin/env node
/**
 * sign-quote.mjs — sign a Floorline price quote with the oracle key.
 *
 * The message format is enforced ON-CHAIN by the vault:
 *   floorline-quote:{position_id}:{price_1e18}:{quote_timestamp_ms}
 * Only the configured oracle key's signature is accepted (T-02).
 *
 * Usage:
 *   node scripts/sign-quote.mjs --position 1 --price 46069405099150147584 \
 *        [--ts <ms>]            → prints { message, ts, signature }
 * The seed comes from ORACLE_SEED_HEX (hex, 32 bytes) in the environment
 * (.env.local). The seed never enters git.
 */
import nacl from "tweetnacl";
import { readFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

function loadSeed() {
  const sources = [process.env.ORACLE_SEED_HEX];
  for (const p of [".env.local", ".env"]) {
    if (existsSync(p)) {
      const m = readFileSync(p, "utf8").match(/^ORACLE_SEED_HEX=([0-9a-fA-F]{64})/m);
      if (m) sources.push(m[1]);
    }
  }
  const hex = sources.find(Boolean);
  if (!hex) {
    console.error("ORACLE_SEED_HEX not set (put the 32-byte hex seed in .env.local)");
    process.exit(1);
  }
  return Buffer.from(hex, "hex");
}

const seed = loadSeed();
const keypair = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));

const position = args.position;
let price = args.price;
if (!position || !price) {
  console.error("usage: sign-quote.mjs --position <id> --price <price_1e18> [--ts <ms>]");
  process.exit(1);
}

const ts = args.ts ? Number(args.ts) : Date.now();
const message = `floorline-quote:${position}:${price}:${ts}`;
const sig = nacl.sign.detached(Buffer.from(message, "utf8"), keypair.secretKey);

console.log(
  JSON.stringify(
    {
      message,
      position: Number(position),
      price_1e18: String(price),
      quote_timestamp_ms: ts,
      signature: Buffer.from(sig).toString("hex"),
      oracle_pubkey_hex: Buffer.from(keypair.publicKey).toString("hex"),
    },
    null,
    2
  )
);
