import { NextResponse } from "next/server";
import { VAULT_CONFIG } from "@/app/lib/floorline";

/**
 * Real deposit-address generation (1Click /v0/deposit/submit). The response's
 * depositAddress is where the user actually sends funds — no placeholder
 * addresses in the UI.
 */
interface DepositRequestBody {
  amountMicro?: number;
  destinationAsset?: string;
  deadlineIso?: string;
}

export async function POST(request: Request) {
  let body: DepositRequestBody;
  try {
    body = (await request.json()) as DepositRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { amountMicro, destinationAsset, deadlineIso } = body;
  if (!Number.isInteger(amountMicro) || (amountMicro ?? 0) <= 0) {
    return NextResponse.json({ error: "amountMicro must be a positive integer" }, { status: 400 });
  }

  const payload = {
    swapType: "EXACT_INPUT",
    slippageTolerance: 100,
    originAsset: VAULT_CONFIG.quoteAssetId,
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
    const res = await fetch("https://1click.chaindefuser.com/v0/deposit/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const raw = (await res.json()) as { depositAddress?: string; error?: { message?: string } };
    if (!res.ok || !raw.depositAddress) {
      return NextResponse.json(
        {
          error: raw?.error?.message ?? raw?.error ?? `Deposit submit rejected (${res.status})`,
          request: payload,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ depositAddress: raw.depositAddress, request: payload });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Deposit submit failed" },
      { status: 502 },
    );
  }
}
