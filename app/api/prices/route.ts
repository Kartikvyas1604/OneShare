import { NextResponse } from "next/server";
import { VAULT_CONFIG, RISK_ASSETS } from "@/app/lib/floorline";

/**
 * Live token prices from NEAR Intents (1Click) — the real, verified public
 * endpoint (Agent.md §1.2). No mock prices: whatever this returns is what the
 * UI shows. Cached 60s server-side; the oracle's own staleness bound is 60s.
 */
export const revalidate = 60;

const NEEDED_ASSET_IDS = new Set<string>([
  VAULT_CONFIG.quoteAssetId,
  VAULT_CONFIG.riskAssetId,
  ...RISK_ASSETS.map((a) => a.assetId),
]);

export async function GET() {
  try {
    const res = await fetch("https://1click.chaindefuser.com/v0/tokens", {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `1Click /v0/tokens returned ${res.status}` },
        { status: 502 },
      );
    }
    const body = (await res.json()) as {
      tokens?: Array<{ assetId: string; symbol: string; price: number; decimals: number; blockchain: string }>;
    };
    const tokens = body.tokens ?? [];
    const prices = tokens
      .filter((t) => NEEDED_ASSET_IDS.has(t.assetId) && typeof t.price === "number")
      .map((t) => ({
        assetId: t.assetId,
        symbol: t.symbol,
        price: t.price,
        decimals: t.decimals,
        blockchain: t.blockchain,
      }));
    return NextResponse.json({ prices, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Price fetch failed" },
      { status: 502 },
    );
  }
}
