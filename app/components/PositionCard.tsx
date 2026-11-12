import Link from "next/link";
import { Position, Ticker } from "@/app/lib/data";
import { formatUsd, formatPercent, formatTokenAmount, truncateAddress } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface PositionCardProps {
  position: Position;
  ticker: Ticker;
  currentPrice: number;
}

function pnlFor(position: Position, currentPrice: number) {
  const usdcInTotal = position.usdc_in / 1e6;
  const entryPrice = position.entry_px / 1e6;
  const shares = position.usdc_in / entryPrice / 1e6;
  const value = shares * currentPrice;
  const pnl = value - usdcInTotal;
  const pnlPct = usdcInTotal > 0 ? pnl / usdcInTotal : 0;
  return { pnl, pnlPct, value };
}

export function PositionCard({ position, ticker, currentPrice }: PositionCardProps) {
  const { pnlPct, value } = pnlFor(position, currentPrice);
  const isPositive = pnlPct >= 0;
  const isActive = position.state === "active";

  return (
    <Link
      href={`/positions/${position.id}`}
      className="group block animate-fade-up rounded-2xl border border-white/[0.07] bg-card p-5 shadow-card transition-all duration-200 hover:border-brand-500/30 hover:shadow-glow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-700/40 font-mono text-sm font-bold text-brand-200">
            N
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                isActive ? "bg-success" : "bg-muted-foreground"
              }`}
              aria-hidden
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {ticker.symbol} <span className="text-muted-foreground">#{position.id}</span>
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {truncateAddress(position.derived_sol, 4)}
            </p>
          </div>
        </div>
        <StatusBadge state={position.state} />
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="font-mono text-xl font-semibold tabular-nums text-foreground">
          {formatUsd(value)}
        </p>
        {isActive && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums ${
              isPositive ? "text-success" : "text-destructive"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
            )}
            {formatPercent(pnlPct, { sign: true })}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Invested
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatUsd(position.usdc_in / 1e6)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Shares
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatTokenAmount(position.nvdax_amount / 1e6)}
          </p>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
            Stop −{(position.policy.stop_loss_bps / 100).toFixed(1)}%
          </span>
          <span className="inline-flex items-center rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
            TP +{(position.policy.take_profit_bps / 100).toFixed(1)}%
          </span>
        </div>
      )}
    </Link>
  );
}
