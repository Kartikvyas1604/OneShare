import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { reconcileDeposits } from "@/app/lib/reconcile";
import { requestIdOf, log } from "@/app/lib/log";

/**
 * POST /api/v1/deposits/reconcile — the keeper's restart sweep, callable on
 * Keeper restart: reconcile every unsettled swap row against
 * /v0/status before anything else"). The keeper daemon also runs it at boot.
 */
export async function POST(request: Request) {
  const __rl = rateLimit("reconcile", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  const requestId = requestIdOf(request);
  const result = await reconcileDeposits();
  log.info("reconcile.request", { requestId, ...result });
  return NextResponse.json(result);
}
