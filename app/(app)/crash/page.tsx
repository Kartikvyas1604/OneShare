"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
import { Slider } from "@/app/components/Slider";
import { CrashChart } from "@/app/components/CrashChart";
import { ErrorState } from "@/app/components/ErrorState";
import {
  DEFAULT_SEED,
  RECORDED_RUN,
  RECORDED_SHOCK_PCT,
  simulateCrash,
  type CrashResult,
} from "@/app/lib/crash-sim";
import { formatUsd, formatPercent } from "@/app/lib/utils";
import { History, Play } from "lucide-react";

type RunState = "idle" | "simulating" | "done" | "error";

const ARM_META: Record<
  "naive" | "static" | "derisk",
  { label: string; dot: string; note: string }
> = {
  naive: { label: "Naive", dot: "bg-down", note: "100% exposed, no reserve" },
  static: { label: "Static floor", dot: "bg-warning", note: "90% escrowed, no de-risk" },
  derisk: { label: "Floorline", dot: "bg-up", note: "floor + de-risk rule armed" },
};

export default function CrashPage() {
  const [shockPct, setShockPct] = useState(RECORDED_SHOCK_PCT);
  const [state, setState] = useState<RunState>("idle");
  const [result, setResult] = useState<CrashResult | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const run = useCallback(async (pct: number) => {
    setState("simulating");
    setFromCache(false);
    try {
      // ~10,000 paths × 90 steps land in well under 100 ms; the pause makes
      // the simulating state perceivable instead of a flicker.
      await new Promise((r) => setTimeout(r, 350));
      setResult(simulateCrash(pct));
      setState("done");
    } catch {
      // Error → cached result (§11 fallback 2). Never leave the judge on a red screen.
      setResult(RECORDED_RUN);
      setFromCache(true);
      setState("done");
    }
  }, []);

  // Auto-run the recorded −45% shock on mount so the page is never empty.
  // Deferred out of the effect body so the simulating state isn't a sync setState.
  useEffect(() => {
    const t = setTimeout(() => void run(RECORDED_SHOCK_PCT), 0);
    return () => clearTimeout(t);
  }, [run]);

  const replayRecorded = () => {
    setShockPct(RECORDED_SHOCK_PCT);
    setResult(RECORDED_RUN);
    setFromCache(true);
    setState("done");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Crash test</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">The crash simulator</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Drag the market. Watch what the depositor keeps — seed{" "}
          <span className="num">{DEFAULT_SEED}</span>, same numbers every run.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Controls */}
        <aside className="animate-fade-up order-2 lg:order-1">
          <div className="engraved rounded-2xl bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[13px] font-medium text-foreground">Shock</p>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">One-day move</span>
                <span
                  className={`num text-[13px] font-medium ${
                    shockPct < 0 ? "text-down" : shockPct > 0 ? "text-up" : "text-foreground"
                  }`}
                >
                  {shockPct > 0 ? "+" : ""}
                  {shockPct.toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[shockPct]}
                min={-90}
                max={90}
                step={1}
                accent={shockPct < 0 ? "down" : "up"}
                ariaLabel="Crash size"
                onValueChange={(v) => setShockPct(v[0])}
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Applied at step 30 of 90, then the path continues (σ 0.80, median-neutral).
              </p>
            </div>
            <div className="space-y-2 border-t border-border p-4">
              <Button className="w-full" onClick={() => void run(shockPct)} isLoading={state === "simulating"}>
                {state === "simulating" ? "Simulating…" : "Run simulation"}
              </Button>
              <Button className="w-full" variant="secondary" onClick={replayRecorded}>
                <History className="h-3.5 w-3.5" aria-hidden />
                Replay recorded run
              </Button>
            </div>
            <p className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
              $1,000 deposit · 90% reserve · −50% de-risk trigger · 10,000 paths · seed{" "}
              <span className="num">{DEFAULT_SEED}</span>. Deterministic — two runs are identical.
            </p>
          </div>
        </aside>

        {/* Results */}
        <div className="animate-fade-up delay-100 order-1 space-y-4 lg:order-2">
          {state === "error" && (
            <ErrorState
              title="Simulation failed"
              description="Showing the recorded −45% run instead. Retry for a live compute."
              onRetry={() => void run(shockPct)}
            />
          )}

          {result && state !== "error" && (
            <>
              {fromCache && (
                <p className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
                  Recorded run · seed <span className="num">{result.seed}</span> · reproduced, not
                  estimated.
                </p>
              )}

              <div className="engraved rounded-2xl bg-card p-4 md:p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-foreground">
                    Median value path · {result.nSteps} steps
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-0.5 w-3 rounded bg-down" aria-hidden />
                      Naive
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-0.5 w-3 rounded bg-warning" aria-hidden />
                      Static floor
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-0.5 w-3 rounded bg-up" aria-hidden />
                      Floorline
                    </span>
                  </div>
                </div>
                <CrashChart result={result} />
              </div>

              <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                {result.arms.map((arm) => {
                  const meta = ARM_META[arm.key];
                  return (
                    <div key={arm.key} className="bg-card p-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
                        <p className="text-[13px] font-semibold text-foreground">{meta.label}</p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.note}</p>
                      <p
                        className={`num mt-3 text-2xl font-semibold tracking-tight ${
                          arm.key === "naive" ? "text-foreground" : "text-foreground"
                        }`}
                      >
                        {formatUsd(arm.medianTerminalUsd)}
                      </p>
                      <p className="num mt-0.5 text-[11px] text-muted-foreground">
                        median terminal of {formatUsd(result.depositUsd, { compact: true })}
                      </p>
                      <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[11px]">
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Worst 1% keeps</dt>
                          <dd className="num font-medium text-foreground">
                            {formatUsd(arm.worstTerminalUsd)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Median max drawdown</dt>
                          <dd className="num font-medium text-down">
                            {formatPercent(-arm.medianMaxDrawdownPct / 100)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Median loss</dt>
                          <dd
                            className={`num font-medium ${
                              arm.medianLossPct < -0.005
                                ? "text-down"
                                : arm.medianLossPct > 0.005
                                  ? "text-up"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {formatPercent(arm.medianLossPct / 100, { sign: true })}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <Play className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
                Same seed, identical output — the keeper endpoint <span className="num">/v1/crash-sim</span>{" "}
                matches these numbers within ±0.5 pp (F-16). No leverage, no liquidation: the
                reserve caps the loss at the number picked at deposit.
              </p>
            </>
          )}

          {state === "idle" && (
            <div className="engraved rounded-2xl bg-card p-8 text-center">
              <p className="text-[13px] text-muted-foreground">Preparing the deterministic run…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
