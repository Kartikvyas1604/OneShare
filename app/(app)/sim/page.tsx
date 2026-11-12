"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/Card";
import { SimChart } from "@/app/components/SimChart";
import { Slider } from "@/app/components/Slider";
import { DEFAULT_POLICY, generateSimulation, Policy } from "@/app/lib/data";
import { formatUsd, formatPercent } from "@/app/lib/utils";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export default function SimPage() {
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const result = useMemo(() => generateSimulation(policy), [policy]);

  return (
    <div className="space-y-5">
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-brand-500/15 bg-gradient-to-br from-brand-900/50 via-card to-background p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl animate-pulse-glow" aria-hidden />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-brand-300">
          Backtest
        </p>
        <h1 className="relative mt-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Would your policy have worked?
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          Simulated on real 2025–26 NVDA daily closes. Deterministic: the same inputs always
          produce the same numbers.
        </p>
      </section>

      <Card className="animate-fade-up delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-300" aria-hidden />
            Equity curve
          </CardTitle>
          <CardDescription>With policy vs buy-and-hold, 252 trading days.</CardDescription>
        </CardHeader>
        <CardContent>
          <SimChart result={result} />
          <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-400" aria-hidden />
              With policy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-500" aria-hidden />
              Buy &amp; hold
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up delay-200">
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
              label="Stops fired"
              value={result.metrics.stops_triggered.toString()}
            />
            <MetricCard
              icon={Activity}
              label="TPs fired"
              value={result.metrics.tps_triggered.toString()}
            />
            <MetricCard icon={Activity} label="CAGR" value={`${result.metrics.cagr_pct.toFixed(1)}%`} />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up delay-300">
        <CardHeader>
          <CardTitle>Policy sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Stop loss</label>
              <span className="font-mono text-xs font-semibold tabular-nums text-destructive">
                −{(policy.stop_loss_bps / 100).toFixed(1)}%
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
              <span className="font-mono text-xs font-semibold tabular-nums text-success">
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
              <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
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

      {/* Data provenance */}
      <div className="animate-fade-up delay-400 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Database, title: "Real data", desc: "NVDA daily closes, 2025–26" },
          { icon: Cpu, title: "Fixed-point math", desc: "No floats, byte-stable" },
          { icon: ShieldCheck, title: "Golden vectors", desc: "sha256-pinned parity TS↔Rust" },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/[0.07] bg-card p-4">
            <c.icon className="h-4 w-4 text-brand-300" aria-hidden />
            <p className="mt-2 text-xs font-semibold text-foreground">{c.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
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
    positive === undefined ? "text-foreground" : positive ? "text-success" : "text-destructive";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 font-mono text-sm font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
