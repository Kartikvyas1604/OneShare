"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Badge } from "@/app/components/Badge";
import { PortfolioChart } from "@/app/components/PortfolioChart";
import { MOCK_POSITIONS, NVDA_TICKER, RECENT_ACTIVITY } from "@/app/lib/data";
import { formatUsd, formatPercent, formatDate, formatTokenAmount } from "@/app/lib/utils";
import {
  TrendingUp,
  Plus,
  ArrowRight,
  ArrowRightLeft,
  TrendingDown,
  Activity,
  Wallet,
} from "lucide-react";

const ranges = ["7D", "1M", "3M", "All"] as const;
type Range = (typeof ranges)[number];

const actionMeta: Record<string, { label: string; icon: React.ElementType }> = {
  Bought: { label: "Bought NVDAx", icon: ArrowRightLeft },
  StopExecuted: { label: "Stop-loss executed", icon: TrendingDown },
  TpExecuted: { label: "Take-profit partial sell", icon: TrendingDown },
  DcaExecuted: { label: "DCA purchase", icon: ArrowRightLeft },
  PriceUpdate: { label: "Price refresh", icon: Activity },
};

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("1M");

  const positions = useMemo(() => MOCK_POSITIONS, []);
  const activePositions = positions.filter((p) => p.state === "active");
  const currentPrice = NVDA_TICKER.price_usdc;

  const invested = positions.reduce((sum, p) => sum + p.usdc_in / 1e6, 0);
  const value = positions.reduce((sum, p) => {
    const entryPrice = p.entry_px / 1e6;
    const shares = p.usdc_in / entryPrice / 1e6;
    return sum + (p.state === "closed" ? p.usdc_in / 1e6 : shares * currentPrice);
  }, 0);
  const pnl = value - invested;
  const pnlPct = invested > 0 ? pnl / invested : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Dashboard</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
        </div>
        <Button size="sm" href="/buy">
          <Plus className="h-4 w-4" aria-hidden />
          New position
        </Button>
      </div>

      {/* Portfolio value card */}
      <Card className="relative overflow-hidden p-0">
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-600/15 blur-3xl"
          aria-hidden
        />
        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Portfolio value
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
                {formatUsd(value)}
              </p>
              <div
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                )}
                {formatPercent(pnlPct, { sign: true })} ·{" "}
                {pnl >= 0 ? "+" : "−"}
                {formatUsd(Math.abs(pnl))}
              </div>
            </div>
            {/* NVDA spark */}
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                NVDAx
              </p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatUsd(currentPrice)}
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-success">
                +2.34%
              </p>
            </div>
          </div>

          {/* Range tabs */}
          <div className="mt-5 inline-flex h-8 items-center rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  range === r
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={range === r}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <PortfolioChart range={range} />
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Invested" value={formatUsd(invested)} />
        <StatCard label="Positions" value={String(positions.length)} />
        <StatCard label="Best policy" value="−9.0%" accent />
      </div>

      {/* Active positions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Active positions</h2>
          <Link
            href="/positions"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        {activePositions.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-foreground">No active positions</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Your first one takes 60 seconds — pay with any token, any chain.
            </p>
            <Button size="sm" variant="secondary" href="/buy">
              Buy your first share
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {activePositions.slice(0, 2).map((p) => {
              const entryPrice = p.entry_px / 1e6;
              const shares = p.usdc_in / entryPrice / 1e6;
              const posValue = shares * currentPrice;
              const posPnl = (posValue - p.usdc_in / 1e6) / (p.usdc_in / 1e6);
              return (
                <Link
                  key={p.id}
                  href={`/positions/${p.id}`}
                  className="group block rounded-2xl border border-white/[0.07] bg-card p-4 transition-all duration-200 hover:border-brand-500/30 hover:shadow-glow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-950 font-mono text-xs font-bold text-brand-300">
                        N
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {NVDA_TICKER.symbol} #{p.id}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {formatTokenAmount(shares)} shares
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatUsd(posValue)}
                      </p>
                      <p
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          posPnl >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatPercent(posPnl, { sign: true })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="success">Stop −9.0%</Badge>
                    <Badge variant="default">TP +25.0%</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">Recent activity</h2>
        <Card className="divide-y divide-white/[0.06] p-0">
          {RECENT_ACTIVITY.map((entry, idx) => {
            const meta = actionMeta[entry.action] ?? { label: entry.action, icon: Activity };
            return (
              <div key={idx} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                  <meta.icon
                    className={`h-4 w-4 ${
                      entry.action.includes("Stop") ? "text-destructive" : "text-brand-300"
                    }`}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{meta.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Position #{entry.position_id} · {formatDate(entry.ts)}
                  </p>
                </div>
                {entry.tx_sig && (
                  <a
                    href={`https://solscan.io/tx/${entry.tx_sig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-[11px] text-brand-300 hover:text-brand-200"
                  >
                    Tx
                  </a>
                )}
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-brand-500/25 bg-brand-500/[0.06]"
          : "border-white/[0.07] bg-card"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-base font-semibold tabular-nums ${
          accent ? "text-brand-200" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
