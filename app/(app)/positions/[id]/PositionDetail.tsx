"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { StatusBadge } from "@/app/components/StatusBadge";
import { StatusTimeline } from "@/app/components/StatusTimeline";
import { AuditLog } from "@/app/components/AuditLog";
import { PolicyEditor } from "@/app/components/PolicyEditor";
import { WhyNearPanel } from "@/app/components/WhyNearPanel";
import { CopyButton } from "@/app/components/CopyButton";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ErrorState } from "@/app/components/ErrorState";
import { MOCK_POSITIONS, NVDA_TICKER, AUDIT_LOG, Policy } from "@/app/lib/data";
import { EXPLORERS } from "@/app/lib/constants";
import { formatUsd, formatPercent, formatTokenAmount, truncateAddress } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight, ChevronRight, ExternalLink } from "lucide-react";

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
    // Real app: vault.set_policy via wallet signature.
    console.log("Policy updated", next);
  };

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/positions" className="transition-colors hover:text-foreground focus-visible:outline-none">
          Stocks
        </Link>
        <ChevronRight className="h-3 w-3 text-faint" aria-hidden />
        <span className="num text-foreground">#{position.id}</span>
      </nav>

      {/* Title + actions */}
      <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card">
            <span className="num text-sm font-semibold text-foreground">N</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {NVDA_TICKER.symbol} <span className="font-normal text-muted-foreground">#{position.id}</span>
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge state={position.state} />
              <span className="text-xs text-muted-foreground">{NVDA_TICKER.name}</span>
            </div>
          </div>
        </div>
        {position.state === "active" && (
          <div className="flex gap-2">
            <Button size="md" variant="sell">
              Sell
            </Button>
            <Button size="md" variant="secondary">
              Withdraw
            </Button>
          </div>
        )}
      </header>

      {/* Value */}
      <section className="animate-fade-up delay-75">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
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

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <Stat label="Invested" value={formatUsd(invested)} />
          <Stat label="Shares" value={formatTokenAmount(shares)} />
          <Stat label="Entry price" value={formatUsd(entryPrice)} />
          <Stat label="Current price" value={formatUsd(currentPrice)} />
        </dl>
      </section>

      {/* Custody */}
      <section className="animate-fade-up delay-100">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div>
              <p className="eyebrow">Custody</p>
              <p className="mt-1 text-[13px] text-foreground">
                Solana account derived by NEAR Chain Signatures
              </p>
            </div>
            <span className="rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
              NEP-171 · pos-{position.id}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5">
            <code className="num text-[13px] text-foreground">
              {truncateAddress(position.derived_sol, 12)}
            </code>
            <CopyButton value={position.derived_sol} />
            <a
              href={`${EXPLORERS.solana.mainnet}/account/${position.derived_sol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              Solscan
            </a>
          </div>
          <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            No one — including OneShare — holds a key. The vault contract requests signatures from
            the MPC network, bounded to your policy.
          </p>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="animate-fade-up delay-150">
        <div className="rounded-xl border border-border bg-card px-4 py-5">
          <StatusTimeline state={position.state} />
        </div>
      </section>

      {/* Policy */}
      {position.state === "active" && (
        <section className="animate-fade-up delay-200">
          <PolicyEditor initialPolicy={position.policy} onChange={handlePolicyChange} />
        </section>
      )}

      {/* Audit */}
      {audit.length > 0 && (
        <section className="animate-fade-up delay-300">
          <AuditLog entries={audit} />
        </section>
      )}

      <WhyNearPanel />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="num mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
