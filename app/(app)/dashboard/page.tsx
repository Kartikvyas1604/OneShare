"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { PortfolioChart } from "@/app/components/PortfolioChart";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ErrorState } from "@/app/components/ErrorState";
import {
  MOCK_POSITIONS,
  RISK_PRICE_USDC,
  VAULT_EVENTS,
  VAULT_CONFIG,
  navQuote,
  worstCaseQuote,
} from "@/app/lib/floorline";
import { EXPLORERS } from "@/app/lib/constants";
import { formatUsd, formatPercent, formatDate, timeAgoLabel } from "@/app/lib/utils";
import {
  TrendingDown,
  Activity,
  ArrowRightLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const ranges = ["7D", "1M", "3M", "All"] as const;
type Range = (typeof ranges)[number];

const eventMeta: Record<string, { label: string; icon: React.ElementType; tone?: "down" | "up" }> = {
  Deposited: { label: "Deposit received", icon: ArrowRightLeft },
  ReserveEscrowed: { label: "Reserve escrowed", icon: Lock },
  BuyAuthorized: { label: "Buy authorized", icon: Activity },
  BuySettled: { label: "Risk bucket bought", icon: CheckCircle2, tone: "up" },
  DeRiskTriggered: { label: "De-risk triggered", icon: TrendingDown, tone: "down" },
  DeRiskSettled: { label: "De-risk settled", icon: TrendingDown, tone: "down" },
  PositionSettled: { label: "Position settled", icon: CheckCircle2, tone: "up" },
  PositionDegraded: { label: "Settlement timed out", icon: AlertTriangle, tone: "down" },
  PositionTransferred: { label: "Position transferred", icon: ArrowRightLeft },
};

export default function DashboardPage() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("1M");

  const positions = useMemo(() => MOCK_POSITIONS, []);
  const price = RISK_PRICE_USDC;
  const events = useMemo(
    () => [...VAULT_EVENTS].sort((a, b) => b.ts - a.ts).slice(0, 5),
    []
  );

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
        title="Couldn't load your portfolio"
        description="This is usually a network hiccup. Try again in a moment."
        onRetry={() => window.location.reload()}
      />
    );
  }

  let deposited = 0;
  let navTotal = 0;
  let worstTotal = 0;
  let reserveTotal = 0;
  for (const p of positions) {
    deposited += p.deposit_amount;
    navTotal += navQuote(p, price);
    worstTotal += worstCaseQuote(p);
    reserveTotal += p.floor_amount;
  }
  const pnl = navTotal - deposited;
  const pnlPct = deposited > 0 ? pnl / deposited : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="display mt-1.5 text-3xl text-foreground">Portfolio</h1>
        </div>
        <Button href="/create">New position</Button>
      </header>

      {/* Value */}
      <section className="animate-fade-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Total NAV</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="num text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {formatUsd(navTotal / 1e6)}
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
              {formatUsd(deposited / 1e6)} deposited · {formatUsd(reserveTotal / 1e6)} escrowed ·
              worst case {formatUsd(worstTotal / 1e6)}
            </p>
          </div>

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

        <div className="mt-6 engraved rounded-2xl bg-card p-4 md:p-5">
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
            icon={ArrowRightLeft}
            title="No positions yet"
            description="Deposit from any chain, pick a loss limit, and own the floor."
            action={{ label: "Create your first position", href: "/create" }}
          />
        ) : (
          <div className="space-y-2.5">
            {positions.slice(0, 3).map((p) => (
              <PositionCard key={p.hex_id} position={p} currentPrice={price} />
            ))}
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="animate-fade-up delay-200">
        <h2 className="eyebrow mb-3 px-0.5">Vault events</h2>
        <div className="overflow-hidden engraved rounded-2xl bg-card">
          <ul className="divide-y divide-border">
            {events.map((entry, idx) => {
              const meta = eventMeta[entry.name] ?? { label: entry.name, icon: Activity };
              return (
                <li key={idx} className="flex items-center gap-3 px-4 py-3.5">
                  <meta.icon
                    className={`h-4 w-4 shrink-0 ${
                      meta.tone === "down" ? "text-down" : meta.tone === "up" ? "text-up" : "text-faint"
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
                  {entry.tx && (
                    <a
                      href={`${EXPLORERS.near.mainnet}/tx/${entry.tx}`}
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

      <p className="text-[11px] leading-relaxed text-faint">
        Vault {VAULT_CONFIG.vaultAccount} · reserve at {VAULT_CONFIG.escrowAccount} · fees off for
        the hackathon.
      </p>
    </div>
  );
}
