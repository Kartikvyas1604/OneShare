import { NextResponse } from "next/server";

/**
 * Real deposit status (1Click /v0/status?depositAddress=).
 * Statuses: PENDING_DEPOSIT | KNOWN_DEPOSIT_TX | PROCESSING | SUCCESS |
 * INCOMPLETE_DEPOSIT | REFUNDED | FAILED (Agent.md §1.2).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing ?address" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://1click.chaindefuser.com/v0/status?depositAddress=${encodeURIComponent(address)}`,
      { cache: "no-store" },
    );
    const raw = (await res.json()) as { status?: string };
    return NextResponse.json({
      status: raw.status ?? `HTTP ${res.status}`,
      raw,
    });
  } catch (err) {
    return NextResponse.json({
      status: "UNREACHABLE",
      error: err instanceof Error ? err.message : "Status check failed",
    });
  }
}
