"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/Card";
import { SimChart } from "@/app/components/SimChart";
import { Slider } from "@/app/components/Slider";
import { DEFAULT_POLICY, generateSimulation, Policy } from "@/app/lib/data";
import { formatUsd, formatPercent } from "@/app/lib/utils";
import { Sparkles, TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function SimPage() {
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);

  const result = useMemo(() => generateSimulation(policy), [policy]);

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Policy simulator</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Backtest your rules on real 2025–26 NVDA daily closes. Numbers regenerate with one command.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" aria-hidden />
            Equity curve
          </CardTitle>
          <CardDescription>Policy vs buy-and-hold over the last 252 trading days.</CardDescription>
        </CardHeader>
        <CardContent>
          <SimChart result={result} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard
              icon={Activity}
              label="Final value"
              value={formatUsd(result.metrics.final_value_usdc)}
            />
            <MetricCard
              icon={TrendingUp}
              label="vs buy & hold"
              value={formatPercent(result.metrics.vs_buy_hold_bps / 10000, { sign: true })}
              positive={result.metrics.vs_buy_hold_bps >= 0}
            />
            <MetricCard
              icon={TrendingDown}
              label="Max drawdown"
              value={formatPercent(-result.metrics.max_drawdown_bps / 10000)}
              positive={false}
            />
            <MetricCard
              icon={Activity}
              label="Stops triggered"
              value={result.metrics.stops_triggered.toString()}
            />
            <MetricCard
              icon={Activity}
              label="TPs triggered"
              value={result.metrics.tps_triggered.toString()}
            />
            <MetricCard
              icon={Activity}
              label="CAGR"
              value={`${result.metrics.cagr_pct.toFixed(1)}%`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Stop loss</label>
              <span className="font-mono text-xs font-semibold text-destructive">
                -{(policy.stop_loss_bps / 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[policy.stop_loss_bps]}
              min={100}
              max={3000}
              step={50}
              onValueChange={(v) => setPolicy((p) => ({ ...p, stop_loss_bps: v[0] }))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Take profit</label>
              <span className="font-mono text-xs font-semibold text-success">
                +{(policy.take_profit_bps / 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[policy.take_profit_bps]}
              min={500}
              max={10000}
              step={100}
              onValueChange={(v) => setPolicy((p) => ({ ...p, take_profit_bps: v[0] }))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">TP sell portion</label>
              <span className="font-mono text-xs font-semibold text-foreground">
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
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  positive?: boolean;
}) {
  const color =
    positive === undefined
      ? "text-foreground"
      : positive
        ? "text-success"
        : "text-destructive";

  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 font-mono text-sm font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
