"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { ErrorState } from "@/app/components/ErrorState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { MOCK_POSITIONS, NVDA_TICKER } from "@/app/lib/data";
import { formatUsd, formatPercent } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
      <div className="mx-auto max-w-xl space-y-8">
        <header>
          <p className="eyebrow">Stocks</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">Positions</h1>
        </header>
        <EmptyState
          icon={ArrowUpRight}
          title="No positions yet"
          description="Your first one takes 60 seconds. Pay with any token, any chain."
          action={{ label: "Buy your first share", href: "/buy" }}
        />
      </div>
    );
  }

  let invested = 0;
  let value = 0;
  for (const p of positions) {
    const inv = p.usdc_in / 1e6;
    invested += inv;
    if (p.state === "closed") {
      value += inv;
    } else {
      const entryPrice = p.entry_px / 1e6;
      const shares = p.usdc_in / entryPrice / 1e6;
      value += shares * currentPrice;
    }
  }
  const pnl = value - invested;
  const pnlPct = invested > 0 ? pnl / invested : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Stocks</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">Positions</h1>
        </div>
        <Button size="md" href="/buy">
          New position
        </Button>
      </header>

      {/* Summary strip */}
      <section className="animate-fade-up grid grid-cols-2 divide-border rounded-xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
        <Cell label="Total value" value={formatUsd(value)} />
        <Cell label="Invested" value={formatUsd(invested)} />
        <Cell
          label="Total PnL"
          value={
            <span className={`num flex items-center justify-end ${isPositive ? "text-up" : "text-down"}`}>
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {formatPercent(pnlPct, { sign: true })}
            </span>
          }
        />
        <Cell label="Live" value={String(positions.filter((p) => p.state === "active").length)} />
      </section>

      {/* List */}
      <section className="animate-fade-up delay-100 space-y-2.5">
        {positions.map((p) => (
          <PositionCard key={p.id} position={p} ticker={NVDA_TICKER} currentPrice={currentPrice} />
        ))}
      </section>

      <p className="animate-fade-up delay-200 text-center text-[11px] text-muted-foreground">
        Each position is a NEP-171 NFT on NEAR. Transfer it and control of the Solana account
        moves with it.
      </p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4">
      <p className="eyebrow">{label}</p>
      <p className="num mt-1 text-right text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  );
}
