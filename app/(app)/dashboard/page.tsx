"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { PortfolioChart } from "@/app/components/PortfolioChart";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ErrorState } from "@/app/components/ErrorState";
import { MOCK_POSITIONS, NVDA_TICKER, RECENT_ACTIVITY } from "@/app/lib/data";
import { EXPLORERS } from "@/app/lib/constants";
import { formatUsd, formatPercent, formatDate, timeAgoLabel } from "@/app/lib/utils";
import { TrendingDown, Activity, ArrowRightLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("1M");

  const positions = useMemo(() => MOCK_POSITIONS, []);
  const currentPrice = NVDA_TICKER.price_usdc;

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn’t load your portfolio"
        description="This is usually a network hiccup. Try again in a moment."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Portfolio math over all positions
  let invested = 0;
  let value = 0;
  for (const p of positions) {
    const inv = p.usdc_in / 1e6;
    invested += inv;
    if (p.state === "closed") {
      value += inv; // proceeds returned; demo shows flat round-trip
    } else {
      const entryPrice = p.entry_px / 1e6;
      const shares = p.usdc_in / entryPrice / 1e6;
      value += shares * currentPrice;
    }
  }
  const pnl = value - invested;
  const pnlPct = invested > 0 ? pnl / invested : 0;
  const isPositive = pnl >= 0;
  const activePositions = positions.filter((p) => p.state === "active");

  return (
    <div className="space-y-10">
      {/* Page header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            Portfolio
          </h1>
        </div>
        <Button size="md" href="/buy">
          New position
        </Button>
      </header>

      {/* Portfolio value */}
      <section className="animate-fade-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Total value</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="num text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {formatUsd(value)}
              </span>
              <span
                className={`num inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-semibold ${
                  isPositive ? "bg-up-soft text-up" : "bg-down-soft text-down"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                )}
                {formatPercent(pnlPct, { sign: true })}
              </span>
            </div>
            <p className="num mt-2 text-[13px] text-muted-foreground">
              {formatUsd(invested)} invested · {activePositions.length} live ·{" "}
              {positions.length - activePositions.length} closed
            </p>
          </div>

          {/* Range switch */}
          <div
            role="tablist"
            aria-label="Chart range"
            className="inline-flex h-9 w-fit items-center gap-0.5 rounded-lg border border-border bg-input p-1"
          >
            {ranges.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors duration-100 focus-visible:outline-none ${
                  range === r
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 md:p-5">
          <PortfolioChart range={range} />
        </div>
      </section>

      {/* Positions */}
      <section className="animate-fade-up delay-100">
        <div className="mb-3 flex items-center justify-between px-0.5">
          <h2 className="eyebrow">Positions</h2>
          <Link
            href="/positions"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
          >
            View all
          </Link>
        </div>
        {positions.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No positions yet"
            description="Your first one takes 60 seconds. Pay with any token, any chain."
            action={{ label: "Buy your first share", href: "/buy" }}
          />
        ) : (
          <div className="space-y-2.5">
            {positions.slice(0, 3).map((p) => (
              <PositionCard key={p.id} position={p} ticker={NVDA_TICKER} currentPrice={currentPrice} />
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="animate-fade-up delay-200">
        <h2 className="eyebrow mb-3 px-0.5">Recent activity</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {RECENT_ACTIVITY.map((entry, idx) => {
              const meta = actionMeta[entry.action] ?? { label: entry.action, icon: Activity };
              return (
                <li key={idx} className="flex items-center gap-3 px-4 py-3.5">
                  <meta.icon
                    className={`h-4 w-4 shrink-0 ${
                      entry.action.includes("Stop") ? "text-down" : "text-faint"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">{meta.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Position #{entry.position_id} · {timeAgoLabel(entry.ts)}
                    </p>
                  </div>
                  <span className="num hidden text-[11px] text-faint sm:block">
                    {formatDate(entry.ts)}
                  </span>
                  {entry.tx_sig && (
                    <a
                      href={`${EXPLORERS.solana.mainnet}/tx/${entry.tx_sig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="num shrink-0 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Tx
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
