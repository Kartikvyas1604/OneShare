"use client";

import { useMemo, useState } from "react";
import { Button } from "@/app/components/Button";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { ErrorState } from "@/app/components/ErrorState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { MOCK_POSITIONS, RISK_PRICE_USDC, navQuote, worstCaseQuote } from "@/app/lib/floorline";
import { formatUsd } from "@/app/lib/utils";
import { Layers } from "lucide-react";

export default function PositionsPage() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const positions = useMemo(() => MOCK_POSITIONS, []);
  const price = RISK_PRICE_USDC;

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
        title="Couldn't load positions"
        description="This is usually a network hiccup. Try again in a moment."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (positions.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <header>
          <p className="eyebrow">Portfolio</p>
          <h1 className="display mt-1.5 text-3xl text-foreground">Positions</h1>
        </header>
        <EmptyState
          icon={Layers}
          title="No positions yet"
          description="Deposit from any chain, pick a loss limit, and own the floor. Your first one takes 60 seconds."
          action={{ label: "Create your first position", href: "/create" }}
        />
      </div>
    );
  }

  let deposited = 0;
  let navTotal = 0;
  let worstTotal = 0;
  for (const p of positions) {
    deposited += p.deposit_amount;
    navTotal += navQuote(p, price);
    worstTotal += worstCaseQuote(p);
  }
  const pnlPct = deposited > 0 ? (navTotal - deposited) / deposited : 0;
  const isPositive = pnlPct >= 0;
  const reserveTotal = positions.reduce((sum, p) => sum + p.floor_amount, 0);
  const live = positions.filter((p) => p.state === "active" || p.state === "open").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1 className="display mt-1.5 text-3xl text-foreground">Positions</h1>
        </div>
        <Button href="/create">New position</Button>
      </header>

      {/* Summary */}
      <section className="animate-fade-up grid grid-cols-2 divide-border rounded-xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
        <Cell label="Total NAV" value={formatUsd(navTotal / 1e6)} />
        <Cell label="Reserve escrowed" value={formatUsd(reserveTotal / 1e6)} />
        <Cell
          label="Worst case"
          value={<span className="text-foreground">{formatUsd(worstTotal / 1e6)}</span>}
        />
        <Cell
          label="Total PnL"
          value={
            <span
              className={`num flex items-center justify-end ${isPositive ? "text-up" : "text-down"}`}
            >
              {formatUsd((navTotal - deposited) / 1e6)}
            </span>
          }
        />
      </section>

      {/* List */}
      <section className="animate-fade-up delay-100 space-y-2.5">
        {positions.map((p) => (
          <PositionCard key={p.hex_id} position={p} currentPrice={price} />
        ))}
      </section>

      <p className="animate-fade-up delay-200 text-center text-[11px] text-muted-foreground">
        {live} live · each position is a NEP-171 NFT on NEAR. Transfer it and the claim moves with
        it — settle pays the new owner.
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
