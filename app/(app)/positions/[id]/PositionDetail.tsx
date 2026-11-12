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
import { CopyButton } from "@/app/components/CopyButton";
import { MOCK_POSITIONS, NVDA_TICKER, AUDIT_LOG, Policy } from "@/app/lib/data";
import { EXPLORERS } from "@/app/lib/constants";
import { formatUsd, formatPercent, formatTokenAmount, truncateAddress } from "@/app/lib/utils";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

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
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/positions"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Back to positions"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {NVDA_TICKER.symbol} <span className="text-muted-foreground">#{position.id}</span>
        </h1>
        <StatusBadge state={position.state} />
      </div>

      {/* Value card */}
      <Card className="relative animate-fade-up overflow-hidden">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-600/15 blur-3xl" aria-hidden />
        <CardContent className="relative pt-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Position value
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
                {formatUsd(value)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
                isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              ) : (
                <ArrowDownRight className="h-4 w-4" aria-hidden />
              )}
              {formatPercent(pnlPct, { sign: true })}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Invested" value={formatUsd(invested)} />
            <Metric label="Shares" value={formatTokenAmount(shares)} />
            <Metric label="Entry" value={formatUsd(entryPrice)} />
            <Metric label="Current" value={formatUsd(currentPrice)} />
          </div>

          {/* Custody */}
          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-300" aria-hidden />
                <span className="text-xs font-semibold text-foreground">Custody via Chain Signatures</span>
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                pos-{position.id}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <code className="font-mono text-xs text-muted-foreground">
                {truncateAddress(position.derived_sol, 12)}
              </code>
              <CopyButton value={position.derived_sol} label="Copy" />
              <a
                href={`${EXPLORERS.solana.mainnet}/account/${position.derived_sol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-300 hover:text-brand-200"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                Solscan
              </a>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              No one — including OneShare — holds a key. Signatures are requested by the vault
              contract via the MPC network.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="animate-fade-up delay-100">
        <CardContent className="pt-5">
          <StatusTimeline state={position.state} />
        </CardContent>
      </Card>

      {/* Policy */}
      {position.state === "active" && (
        <PolicyEditor initialPolicy={position.policy} onChange={handlePolicyChange} />
      )}

      {/* Audit */}
      {audit.length > 0 && (
        <div className="animate-fade-up delay-200">
          <AuditLog entries={audit} />
        </div>
      )}

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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
