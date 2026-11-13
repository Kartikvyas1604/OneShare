import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { log, requestIdOf } from "@/app/lib/log";
import { runKeeperAction, type KeeperAction } from "@/app/lib/keeper";

/**
 * POST /v1/rebalance (§6.3) — run ONE keeper action for a position.
 * Idempotent per (position, epoch): re-running for a position that was
 * already bought / already de-risked in this epoch is a no-op (the on-chain
 * state is checked before acting — the same idempotence the keeper loop has).
 *
 * Body: `{ position_id, owner? }` → `{ executed, reason?, tx? }`
 * Executed via the near CLI with the keeper keychain key (never env keys).
 */
export async function POST(request: Request) {
  const __rl = rateLimit("rebalance", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);

  let body: { position_id?: unknown; owner?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const positionId = Number(body.position_id);
  if (!Number.isInteger(positionId) || positionId <= 0) {
    return NextResponse.json({ error: "position_id must be a positive integer" }, { status: 400 });
  }
  const owner = typeof body.owner === "string" && body.owner.length > 0 ? body.owner : null;
  if (!owner) {
    return NextResponse.json({ error: "owner required (the account holding the position)" }, { status: 400 });
  }

  try {
    const action: KeeperAction = await runKeeperAction(positionId, owner);
    log.info("rebalance.run", {
      requestId: requestIdOf(request),
      position: positionId,
      executed: action.executed,
      reason: action.reason ?? null,
    });
    return NextResponse.json(action);
  } catch (err) {
    return NextResponse.json(
      { error: "keeper_action_failed", detail: String(err).slice(0, 200) },
      { status: 502 },
    );
  }
}
