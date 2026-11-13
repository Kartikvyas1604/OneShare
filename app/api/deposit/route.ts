import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { VAULT_CONFIG } from "@/app/lib/floorline";
import { saveDeposit } from "@/app/lib/deposit-store";
import { log, requestIdOf } from "@/app/lib/log";

/**
 * Real deposit-address generation via the 1Click reusable-address flow
 * (docs: "Reusable deposit addresses"): POST /v0/quote with
 * swapType ANY_INPUT / originAsset 1cs_v1:any / destinationAsset 1cs_v1:original
 * and deadline 2038-01-01, authenticated with the partner X-API-Key and the
 * user's session JWT. The addresses come back on quote.chainDepositAddresses
 * — one per chain — and every later deposit to them is tracked by /v0/status.
 *
 * Without the partner key (spec task G-4: partners.near-intents.org) the
 * endpoint returns the API's real rejection plus the remediation — it never
 * fabricates an address.
 */

export const dynamic_none = undefined; // no segment config (cacheComponents)

const REUSABLE_DEADLINE = "2038-01-01T00:00:00.000Z";

interface DepositRequestBody {
  /** Optional per-deposit amount (micro-USDC) recorded for tracking. */
  amountMicro?: number;
  /** NEAR account that should own the addresses (recipient + refund sink). */
  ownerAccountId?: string;
}

export async function POST(request: Request) {
  const __rl = rateLimit("deposit", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  const requestId = requestIdOf(request);
  let body: DepositRequestBody;
  try {
    body = (await request.json()) as DepositRequestBody;
  } catch {
    body = {};
  }

  const owner = body.ownerAccountId ?? VAULT_CONFIG.vaultAccount;
  if (!/^[a-z0-9._-]+\.(near|testnet)$/.test(owner)) {
    return NextResponse.json(
      { error: "ownerAccountId must be a valid NEAR account id" },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ONE_CLICK_API_KEY) headers["X-API-Key"] = process.env.ONE_CLICK_API_KEY;
  const userJwt = request.headers.get("authorization");
  if (userJwt) headers["Authorization"] = userJwt;

  const payload = {
    dry: false,
    swapType: "ANY_INPUT",
    originAsset: "1cs_v1:any",
    depositType: "INTENTS",
    destinationAsset: "1cs_v1:original",
    amount: "0",
    slippageTolerance: 50,
    recipient: owner,
    recipientType: "INTENTS",
    refundTo: owner,
    refundType: "INTENTS",
    deadline: REUSABLE_DEADLINE,
  };

  try {
    const res = await fetch("https://1click.chaindefuser.com/v0/quote", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const raw = (await res.json()) as {
      quote?: {
        depositAddress?: string;
        chainDepositAddresses?: Array<{
          blockchain?: string;
          depositAddress?: string;
          memo?: string;
        }>;
      };
      message?: string;
    };

    const chainAddresses = raw.quote?.chainDepositAddresses ?? [];
    const primary = raw.quote?.depositAddress ?? chainAddresses[0]?.depositAddress;

    if (!res.ok || !primary) {
      const upstream = raw.message ?? `Deposit address request rejected (${res.status})`;
      const needsPartnerKey =
        /api.key|partner|unauthor/i.test(upstream) || !process.env.ONE_CLICK_API_KEY;
      log.warn("deposit.address.rejected", { requestId, upstream, needsPartnerKey });
      return NextResponse.json(
        {
          error: upstream,
          remediation: needsPartnerKey
            ? "Deposit-address creation needs the 1Click partner X-API-Key from partners.near-intents.org (spec task G-4). Set ONE_CLICK_API_KEY to enable the real flow — no address is ever simulated."
            : undefined,
          request: { owner, swapType: payload.swapType },
        },
        { status: 502 },
      );
    }

    // Real addresses: persist every chain entry for durable tracking.
    const records = chainAddresses.length > 0 ? chainAddresses : [{ depositAddress: primary }];
    for (const addr of records) {
      if (!addr.depositAddress) continue;
      await saveDeposit({
        depositAddress: addr.depositAddress,
        amountMicro: body.amountMicro ?? 0,
        destinationAsset: VAULT_CONFIG.riskAssetId,
        deadlineIso: REUSABLE_DEADLINE,
        createdAt: Date.now(),
      });
    }
    log.info("deposit.addresses.created", {
      requestId,
      owner,
      chains: records.map((r) => r.blockchain ?? "unknown"),
    });

    return NextResponse.json({
      depositAddress: primary,
      chainDepositAddresses: chainAddresses,
      owner,
    });
  } catch (err) {
    log.error("deposit.address.failed", {
      requestId,
      error: err instanceof Error ? err.message : "Deposit address request failed",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Deposit address request failed" },
      { status: 502 },
    );
  }
}
