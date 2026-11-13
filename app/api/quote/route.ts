import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { VAULT_CONFIG } from "@/app/lib/floorline";

/**
 * Real NEAR Intents quote (1Click /v0/quote). dry:true is unauthenticated
 * (verified Agent.md §1.2 / G-1). The raw real response is passed through —
 * including its real errors when a parameter is rejected.
 */
interface QuoteRequestBody {
  amountMicro?: number;
  destinationAsset?: string;
  deadlineIso?: string;
}

export async function POST(request: Request) {
  const __rl = rateLimit("quote", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  let body: QuoteRequestBody;
  try {
    body = (await request.json()) as QuoteRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { amountMicro, destinationAsset, deadlineIso } = body;
  if (!Number.isInteger(amountMicro) || (amountMicro ?? 0) <= 0) {
    return NextResponse.json({ error: "amountMicro must be a positive integer (USDC, 1e6 = $1)" }, { status: 400 });
  }

  const payload = {
    dry: true,
    swapType: "EXACT_INPUT",
    slippageTolerance: 100, // 1%
    originAsset: VAULT_CONFIG.quoteAssetId, // USDC on NEAR
    depositType: "INTENTS",
    destinationAsset: destinationAsset ?? VAULT_CONFIG.riskAssetId,
    amount: String(amountMicro),
    recipient: VAULT_CONFIG.vaultAccount,
    recipientType: "INTENTS",
    refundTo: VAULT_CONFIG.vaultAccount,
    refundType: "INTENTS",
    deadline: deadlineIso ?? new Date(Date.now() + 30 * 60_000).toISOString(),
  };

  try {
    const res = await fetch("https://1click.chaindefuser.com/v0/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: raw?.message ?? `1Click quote rejected (${res.status})`, request: payload },
        { status: 502 },
      );
    }
    return NextResponse.json({ quote: raw.quote, quoteRequest: raw.quoteRequest });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Quote request failed" },
      { status: 502 },
    );
  }
}
