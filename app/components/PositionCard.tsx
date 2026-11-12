import Link from "next/link";
import { Position, Ticker } from "@/app/lib/data";
import { formatUsd, formatPercent, formatTokenAmount } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface PositionCardProps {
  position: Position;
  ticker: Ticker;
  currentPrice: number;
}

function metricsFor(position: Position, currentPrice: number) {
  const invested = position.usdc_in / 1e6;
  const entryPrice = position.entry_px / 1e6;
  const shares = position.usdc_in / entryPrice / 1e6;
  const value = shares * currentPrice;
  const pnl = value - invested;
  const pnlPct = invested > 0 ? pnl / invested : 0;
  return { invested, shares, value, pnl, pnlPct };
}

export function PositionCard({ position, ticker, currentPrice }: PositionCardProps) {
  const { invested, shares, value, pnlPct } = metricsFor(position, currentPrice);
  const isPositive = pnlPct >= 0;
  const isLive = position.state === "active";

  return (
    <Link
      href={`/positions/${position.hex_id}`}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center"
    >
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
          <span className="num text-xs font-semibold text-foreground">N</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">{ticker.symbol}</p>
        </div>
      </div>

      {/* Value + PnL */}
      <div className="flex items-center justify-between gap-6 sm:justify-end">
        <div className="text-right">
          <p className="num text-sm font-semibold text-foreground">{formatUsd(value)}</p>
          <p className="num text-[11px] text-muted-foreground">
            {formatTokenAmount(shares)} sh · {formatUsd(invested)} in
          </p>
        </div>
        {isLive ? (
          <span
            className={`num inline-flex min-w-20 items-center justify-end gap-1 text-[13px] font-semibold ${
              isPositive ? "text-up" : "text-down"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
            )}
            {formatPercent(pnlPct, { sign: true })}
          </span>
        ) : (
          <StatusBadge state={position.state} />
        )}
      </div>

      {/* Policy chips */}
      {isLive && (
        <div className="flex gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
          <span className="rounded-md border border-down/25 bg-down-soft px-2 py-0.5 text-[10px] font-medium text-down">
            Stop −{(position.policy.stop_loss_bps / 100).toFixed(1)}%
          </span>
          <span className="rounded-md border border-up/25 bg-up-soft px-2 py-0.5 text-[10px] font-medium text-up">
            TP +{(position.policy.take_profit_bps / 100).toFixed(1)}%
          </span>
        </div>
      )}
    </Link>
  );
}
