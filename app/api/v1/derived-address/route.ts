import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { keccak256 } from "js-sha3";
import bs58 from "bs58";

/**
 * GET /api/v1/derived-address?account=<near>&path=<floorline-1>
 *
 * SPINE #2 — Chain Signatures. The position's treasury address on other
 * chains, derived by the REAL MPC network: `v1.signer-prod.testnet`
 * (testnet) / `v1.signer` (mainnet) computes the child public key for
 * (predecessor account, derivation path) — the only account that can sign
 * for that address is the contract that holds the position.
 *
 * Derivation is pure math on public data (no transaction). The EVM address
 * is the last 20 bytes of keccak256 over the uncompressed key — decompressed
 * here from the contract's compressed key with pure BigInt EC math.
 */

const MPC = {
  testnet: "v1.signer-prod.testnet",
  mainnet: "v1.signer",
};

const RPC = {
  testnet: process.env.NEAR_RPC_URL || "https://near-testnet.drpc.org",
  mainnet: "https://rpc.mainnet.near.org",
};

// secp256k1 field + curve constants.
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const THREE = 3n;
const SEVEN = 7n;

function modPow(base: bigint, exp: bigint, p: bigint): bigint {
  let result = 1n;
  let b = base % p;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % p;
    b = (b * b) % p;
    e >>= 1n;
  }
  return result;
}

/** Compressed SEC1 key (0x02/0x03 ‖ x) → uncompressed (0x04 ‖ x ‖ y). */
function decompress(compressed: Uint8Array): Uint8Array | null {
  if (compressed.length !== 33 || (compressed[0] !== 2 && compressed[0] !== 3)) return null;
  const yParity = compressed[0] === 3;
  const x = BigInt("0x" + Buffer.from(compressed.slice(1)).toString("hex"));

  // y² = x³ + 7 (mod p)
  const ySquared = (modPow(x, THREE, P) + SEVEN) % P;
  let y = modPow(ySquared, (P + 1n) / 4n, P);
  if ((y * y) % P !== ySquared) return null;
  if ((y & 1n) !== BigInt(yParity)) y = P - y;

  const out = new Uint8Array(65);
  out[0] = 4;
  out.set(Buffer.from(x.toString(16).padStart(64, "0"), "hex"), 1);
  out.set(Buffer.from(y.toString(16).padStart(64, "0"), "hex"), 33);
  return out;
}

function evmAddressFromUncompressed(uncompressed: Uint8Array): string {
  const hash = keccak256(Buffer.from(uncompressed.slice(1))); // keccak over x‖y (no 0x04)
  return "0x" + hash.slice(-40);
}

export async function GET(request: Request) {
  const __rl = rateLimit("derived-address", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);

  const url = new URL(request.url);
  const account = url.searchParams.get("account");
  const path = url.searchParams.get("path") ?? "floorline-1";
  const network = url.searchParams.get("network") === "mainnet" ? "mainnet" : "testnet";

  if (!account || account.length === 0 || account.length > 64) {
    return NextResponse.json({ error: "account required" }, { status: 400 });
  }

  try {
    const argsB64 = Buffer.from(
      JSON.stringify({ path, predecessor: account, domain: 0 })
    ).toString("base64");
    const res = await fetch(RPC[network], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "floorline",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: MPC[network],
          method_name: "derived_public_key",
          args_base64: argsB64,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json();
    if (!json.result?.result) {
      return NextResponse.json(
        { error: "mpc_derivation_failed", detail: JSON.stringify(json).slice(0, 200) },
        { status: 502 },
      );
    }
    const keyStr = JSON.parse(Buffer.from(json.result.result).toString()) as string;
    const base58Part = keyStr.replace(/^secp256k1:/, "");
    const raw = bs58.decode(base58Part) as Uint8Array;
    // The MPC returns the 64-byte x‖y (no 0x04 prefix); legacy callers may
    // send the 33-byte SEC1 compressed form.
    let uncompressed: Uint8Array | null;
    if (raw.length === 64) {
      uncompressed = new Uint8Array(65);
      uncompressed[0] = 4;
      uncompressed.set(raw, 1);
    } else {
      uncompressed = decompress(raw);
    }
    if (!uncompressed) {
      return NextResponse.json({ error: "key_decompression_failed", key_len: raw.length }, { status: 502 });
    }

    return NextResponse.json({
      account,
      path,
      domain: 0,
      network,
      mpc_contract: MPC[network],
      derived_public_key: keyStr,
      evm_address: evmAddressFromUncompressed(uncompressed),
      note: "Derived by the real MPC network. Only the contract holding the position can sign for this address (Chain Signatures).",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_unreachable", detail: String(err).slice(0, 160) },
      { status: 502 },
    );
  }
}
