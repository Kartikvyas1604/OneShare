"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { StatusBadge } from "@/app/components/StatusBadge";
import { StatusTimeline } from "@/app/components/StatusTimeline";
import { AuditLog } from "@/app/components/AuditLog";
import { PolicyEditor } from "@/app/components/PolicyEditor";
import { WhyNearPanel } from "@/app/components/WhyNearPanel";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ErrorState } from "@/app/components/ErrorState";
import { MOCK_POSITIONS, NVDA_TICKER, AUDIT_LOG, Policy } from "@/app/lib/data";
import { formatUsd, formatPercent, formatTokenAmount, truncateAddress } from "@/app/lib/utils";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Wallet, ExternalLink } from "lucide-react";

export function PositionDetail({ id }: { id: number }) {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const position = useMemo(() => MOCK_POSITIONS.find((p) => p.id === id), [id]);
  const audit = useMemo(() => AUDIT_LOG.filter((a) => a.position_id === id), [id]);
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
        title="Couldn’t load position"
        description="This is usually a network hiccup. Try again in a moment."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!position) {
    return (
      <ErrorState
        title="Position not found"
        description="We couldn’t find that position. It may have been withdrawn or the ID is incorrect."
      />
    );
  }

  const entryPrice = position.entry_px / 1e6;
  const shares = position.nvdax_amount / 10 ** NVDA_TICKER.decimals;
  const value = shares * currentPrice;
  const invested = position.usdc_in / 1e6;
  const pnl = value - invested;
  const pnlPct = invested > 0 ? pnl / invested : 0;
  const isPositive = pnl >= 0;

  const handlePolicyChange = (next: Policy) => {
    // In a real app this would call set_policy on the vault contract.
    console.log("Policy updated", next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/positions"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Back to positions"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {NVDA_TICKER.symbol}
        </h1>
        <StatusBadge state={position.state} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Position value
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {formatUsd(value)}
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              ) : (
                <ArrowDownRight className="h-4 w-4" aria-hidden />
              )}
              {formatPercent(pnlPct, { sign: true })}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Invested" value={formatUsd(invested)} />
            <Metric label="Shares" value={formatTokenAmount(shares)} />
            <Metric label="Entry price" value={formatUsd(entryPrice)} />
            <Metric label="Current" value={formatUsd(currentPrice)} />
          </div>

          <div className="mt-5 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="text-xs text-muted-foreground">Derived Solana address</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="font-mono text-xs text-foreground">
                {truncateAddress(position.derived_sol, 12)}
              </code>
              <a
                href={`https://solscan.io/account/${position.derived_sol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="View on Solscan"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <StatusTimeline state={position.state} />
        </CardContent>
      </Card>

      {position.state === "active" && (
        <PolicyEditor initialPolicy={position.policy} onChange={handlePolicyChange} />
      )}

      {audit.length > 0 && <AuditLog entries={audit} />}

      <WhyNearPanel />

      {position.state === "active" && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary">Sell</Button>
          <Button variant="outline">Withdraw</Button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
