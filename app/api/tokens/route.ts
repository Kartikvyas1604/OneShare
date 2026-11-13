import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { log, requestIdOf } from "@/app/lib/log";

/**
 * The full live 1Click token list (230 tokens, 39 chains) — powers the
 * pay-with picker. Prices are the oracle's own; no hardcoded data.
 */
export async function GET(request: Request) {
  const __rl = rateLimit("prices", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  const requestId = requestIdOf(request);
  try {
    const res = await fetch("https://1click.chaindefuser.com/v0/tokens", {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `1Click /v0/tokens returned ${res.status}` },
        { status: 502 },
      );
    }
    const rawBody = (await res.json()) as
      | Array<{ assetId: string; symbol: string; price: number; decimals: number; blockchain: string }>
      | { tokens?: Array<{ assetId: string; symbol: string; price: number; decimals: number; blockchain: string }> };
    const tokens = Array.isArray(rawBody) ? rawBody : (rawBody.tokens ?? []);
    return NextResponse.json({
      tokens: tokens
        .filter((t) => typeof t.price === "number")
        .map((t) => ({
          assetId: t.assetId,
          symbol: t.symbol,
          price: t.price,
          decimals: t.decimals,
          blockchain: t.blockchain,
        })),
      count: tokens.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    log.error("tokens.failed", {
      requestId,
      error: err instanceof Error ? err.message : "Token list fetch failed",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token list fetch failed" },
      { status: 502 },
    );
  }
}
