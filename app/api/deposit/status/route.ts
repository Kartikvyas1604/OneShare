import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { getDeposit, updateDepositStatus } from "@/app/lib/deposit-store";
import { log, requestIdOf } from "@/app/lib/log";

/**
 * Real deposit status (1Click /v0/status?depositAddress=).
 * Statuses: PENDING_DEPOSIT | KNOWN_DEPOSIT_TX | PROCESSING | SUCCESS |
 * INCOMPLETE_DEPOSIT | REFUNDED | FAILED (Agent.md §1.2).
 */
export async function GET(request: Request) {
  const __rl = rateLimit("deposit", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  const requestId = requestIdOf(request);
  const address = new URL(request.url).searchParams.get("address");
  if (!address || !/^[A-Za-z0-9:_-]{10,130}$/.test(address)) {
    return NextResponse.json({ error: "Missing or invalid ?address" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://1click.chaindefuser.com/v0/status?depositAddress=${encodeURIComponent(address)}`,
      { cache: "no-store" },
    );
    const raw = (await res.json()) as { status?: string };
    const status = raw.status ?? `HTTP ${res.status}`;
    // Durable record only exists for deposits created through this app.
    const record = await getDeposit(address);
    if (record) await updateDepositStatus(address, status);
    log.info("deposit.status", { requestId, status, known: Boolean(record) });
    return NextResponse.json({
      status,
      known: Boolean(record),
      raw,
    });
  } catch (err) {
    log.error("deposit.status.failed", {
      requestId,
      error: err instanceof Error ? err.message : "Status check failed",
    });
    return NextResponse.json({
      status: "UNREACHABLE",
      error: err instanceof Error ? err.message : "Status check failed",
    });
  }
}
