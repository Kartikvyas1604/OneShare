"use client";

import { useMemo, useState } from "react";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { ErrorState } from "@/app/components/ErrorState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { Button } from "@/app/components/Button";
import { MOCK_POSITIONS, NVDA_TICKER } from "@/app/lib/data";
import { formatUsd, formatPercent } from "@/app/lib/utils";
import { PieChart, Plus, TrendingUp, TrendingDown } from "lucide-react";

export default function PositionsPage() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
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
        title="Couldn’t load positions"
        description="This is usually a network hiccup. Try again in a moment."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (positions.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No positions yet"
        description="Your first one takes 60 seconds. Pay with any token, any chain."
        action={{ label: "Buy your first share", href: "/buy" }}
      />
    );
  }

  const invested = positions.reduce((s, p) => s + p.usdc_in / 1e6, 0);
  const value = positions.reduce((s, p) => {
    const entryPrice = p.entry_px / 1e6;
    const shares = p.usdc_in / entryPrice / 1e6;
    return s + (p.state === "closed" ? p.usdc_in / 1e6 : shares * currentPrice);
  }, 0);
  const pnl = value - invested;
  const pnlPct = invested > 0 ? pnl / invested : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Positions</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            Your stocks
          </h1>
        </div>
        <Button size="sm" href="/buy">
          <Plus className="h-4 w-4" aria-hidden />
          New
        </Button>
      </div>

      {/* Summary bar */}
      <div className="animate-fade-up flex items-center justify-between rounded-2xl border border-white/[0.07] bg-card px-4 py-3.5 shadow-card">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total value
          </p>
          <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatUsd(value)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {formatUsd(invested)} invested
          </p>
          <p
            className={`mt-1 inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums ${
              isPositive ? "text-success" : "text-destructive"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            )}
            {formatPercent(pnlPct, { sign: true })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {positions.map((position, idx) => (
          <div key={position.id} className={`animate-fade-up delay-${Math.min((idx + 1) * 100, 400)}`}>
            <PositionCard
              position={position}
              ticker={NVDA_TICKER}
              currentPrice={currentPrice}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
