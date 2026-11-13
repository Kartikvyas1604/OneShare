import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";

/**
 * Live US equity quotes for the Floorline risk leg (tokenized-equity wedge).
 *
 * Source: Yahoo Finance chart API (public, no key). When Ondo's tokenized stocks list
 * on 1Click, the on-chain oracle switches to the 1Click quote and this feed
 * becomes the fallback. No mock data: every quote comes from the wire.
 */

const YAHOO_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/NVDA?interval=1d&range=1d";

const REVALIDATE_SEC = 30;

export async function GET(request: Request) {
  const __rl = rateLimit("equity-price", clientIp(request));
  if (!__rl.ok) {
    return tooManyRequests(__rl.retryAfterSec);
  }

  try {
    const res = await fetch(YAHOO_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (floorline-keeper/0.1)" },
      next: { revalidate: REVALIDATE_SEC },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_error", status: res.status },
        { status: 502 },
      );
    }
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            symbol?: string;
            currency?: string;
            exchangeName?: string;
            regularMarketPrice?: number;
            previousClose?: number;
            regularMarketTime?: number;
          };
        }>;
      };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (!meta || typeof price !== "number" || price <= 0) {
      return NextResponse.json({ error: "unparseable_quote" }, { status: 502 });
    }

    const changePct =
      typeof meta.previousClose === "number" && meta.previousClose > 0
        ? ((price - meta.previousClose) / meta.previousClose) * 100
        : null;

    return NextResponse.json(
      {
        symbol: meta.symbol ?? "NVDA",
        price,
        currency: meta.currency ?? "USD",
        changePct: changePct === null ? null : Number(changePct.toFixed(2)),
        marketTimeUnixSec: meta.regularMarketTime ?? null,
        exchange: meta.exchangeName ?? null,
        source: "yahoo-finance",
        fetchedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": `s-maxage=${REVALIDATE_SEC}` } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_unreachable", detail: String(err).slice(0, 120) },
      { status: 502 },
    );
  }
}
