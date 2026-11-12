"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/app/components/Slider";
import { SimChart } from "@/app/components/SimChart";
import { DEFAULT_POLICY, generateSimulation, Policy } from "@/app/lib/data";
import { formatUsd, formatPercent } from "@/app/lib/utils";

export default function SimPage() {
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const result = useMemo(() => generateSimulation(policy), [policy]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Simulator</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
          Policy backtester
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Real 2025–26 NVDA daily closes · fixed-point math · deterministic output
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Controls */}
        <aside className="animate-fade-up order-2 space-y-6 lg:order-1">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[13px] font-medium text-foreground">Your policy</p>
            </div>
            <div className="divide-y divide-border">
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Stop loss</span>
                  <span className="num text-[13px] font-medium text-down">
                    −{(policy.stop_loss_bps / 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[policy.stop_loss_bps]}
                  min={100}
                  max={3000}
                  step={50}
                  accent="down"
                  onValueChange={(v) => setPolicy((p) => ({ ...p, stop_loss_bps: v[0] }))}
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Take profit</span>
                  <span className="num text-[13px] font-medium text-up">
                    +{(policy.take_profit_bps / 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[policy.take_profit_bps]}
                  min={500}
                  max={10000}
                  step={100}
                  accent="up"
                  onValueChange={(v) => setPolicy((p) => ({ ...p, take_profit_bps: v[0] }))}
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Sell portion at TP</span>
                  <span className="num text-[13px] font-medium text-foreground">
                    {(policy.tp_sell_bps / 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[policy.tp_sell_bps]}
                  min={1000}
                  max={10000}
                  step={500}
                  onValueChange={(v) => setPolicy((p) => ({ ...p, tp_sell_bps: v[0] }))}
                />
              </div>
            </div>
            <p className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
              Same math as the onchain policy engine. Golden vectors pinned by sha256.
            </p>
          </div>
        </aside>

        {/* Chart + metrics */}
        <div className="animate-fade-up delay-100 order-1 space-y-4 lg:order-2">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-foreground">Equity curve · 252 days</p>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-up" aria-hidden />
                  With policy
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-[#5c5c5c]" aria-hidden />
                  Buy &amp; hold
                </span>
              </div>
            </div>
            <SimChart result={result} />
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            <Metric label="Final value" value={formatUsd(result.metrics.final_value_usdc)} />
            <Metric
              label="vs buy & hold"
              value={formatPercent(result.metrics.vs_buy_hold_bps / 10000, { sign: true })}
              tone={result.metrics.vs_buy_hold_bps >= 0 ? "up" : "down"}
            />
            <Metric
              label="Max drawdown"
              value={formatPercent(-result.metrics.max_drawdown_bps / 10000)}
              tone="down"
            />
            <Metric label="Stops fired" value={String(result.metrics.stops_triggered)} />
            <Metric label="TPs fired" value={String(result.metrics.tps_triggered)} />
            <Metric label="CAGR" value={`${result.metrics.cagr_pct.toFixed(1)}%`} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`num mt-1 text-sm font-semibold ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
