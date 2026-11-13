import { NextResponse } from "next/server";
import { simulateCrash } from "@/app/lib/crash-sim";
import { log, requestIdOf } from "@/app/lib/log";

/**
 * Keeper API §6.3 — POST /v1/crash-sim
 * Request:  { shock_pct, seed? }        (−90…+90)
 * Response: { floorline_loss_pct, naive_loss_pct, path[] } — real deterministic
 * computation (seeded, reproducible), matching the browser crash test.
 */

const MAX_SHOCK = 90;
const MIN_SHOCK = -90;
const DEFAULT_DEPOSIT = 1_000;

interface CrashSimBody {
  shock_pct?: number;
  seed?: number;
}

export async function POST(request: Request) {
  const requestId = requestIdOf(request);
  let body: CrashSimBody;
  try {
    body = (await request.json()) as CrashSimBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const shock = body.shock_pct ?? DEMO;
  if (typeof shock !== "number" || !Number.isFinite(shock) || shock < MIN_SHOCK || shock > MAX_SHOCK) {
    return NextResponse.json(
      { error: `shock_pct must be a number between ${MIN_SHOCK} and ${MAX_SHOCK}` },
      { status: 400 },
    );
  }
  if (body.seed !== undefined && (!Number.isInteger(body.seed) || body.seed <= 0)) {
    return NextResponse.json({ error: "seed must be a positive integer" }, { status: 400 });
  }

  const result = simulateCrash(shock, {
    seed: body.seed ?? undefined,
    depositUsd: DEFAULT_DEPOSIT,
  });
  const naive = result.arms[0];
  const floorline = result.arms[2];

  log.info("crash-sim", {
    requestId,
    shockPct: shock,
    seed: result.seed,
    naiveLoss: naive.medianLossPct,
    floorlineLoss: floorline.medianLossPct,
  });

  return NextResponse.json({
    shock_pct: shock,
    seed: result.seed,
    floorline_loss_pct: floorline.medianLossPct,
    naive_loss_pct: naive.medianLossPct,
    floorline: {
      median_terminal_usd: floorline.medianTerminalUsd,
      worst_1pct_usd: floorline.worstTerminalUsd,
      median_max_drawdown_pct: floorline.medianMaxDrawdownPct,
    },
    naive: {
      median_terminal_usd: naive.medianTerminalUsd,
      worst_1pct_usd: naive.worstTerminalUsd,
      median_max_drawdown_pct: naive.medianMaxDrawdownPct,
    },
    path: floorline.path,
  });
}

const DEMO = -45;
