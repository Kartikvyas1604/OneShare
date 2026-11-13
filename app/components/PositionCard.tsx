import Link from "next/link";
import type { VaultPosition } from "@/app/lib/vault";
import { navQuote, worstCaseQuote, riskAsset } from "@/app/lib/floorline";
import { formatUsd, formatPercent } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StateBadge } from "./vault/StateBadge";
import { Badge } from "./Badge";

interface PositionCardProps {
  position: VaultPosition;
  /** Live 1Click price; undefined while the price feed loads. */
  currentPrice?: number;
}

export function PositionCard({ position, currentPrice }: PositionCardProps) {
  const asset = riskAsset(position.risk_asset_id);
  const hasPrice = typeof currentPrice === "number";
  const nav = hasPrice ? navQuote(position, currentPrice) / 1e6 : null;
  const worst = worstCaseQuote(position) / 1e6;
  const deposited = position.deposit_amount / 1e6;
  const pnlPct = hasPrice && deposited > 0 ? ((nav as number) - deposited) / deposited : 0;
  const isPositive = pnlPct >= 0;
  const reservePct = position.deposit_amount > 0
    ? (position.floor_amount / position.deposit_amount) * 100
    : 0;

  return (
    <Link
      href={`/vault/${position.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center"
    >
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-[11px] font-semibold text-foreground">
          {asset.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">{asset.symbol}</p>
          <div className="mt-0.5">
            <StateBadge state={position.state} />
          </div>
        </div>
      </div>

      {/* NAV + worst case — from live price and on-chain state */}
      <div className="flex items-center justify-between gap-6 sm:justify-end">
        <div className="text-right">
          <p className="num text-sm font-semibold text-foreground">
            {hasPrice ? formatUsd(nav as number) : "—"}
          </p>
          <p className="num text-[11px] text-muted-foreground">worst case {formatUsd(worst)}</p>
        </div>
        {hasPrice && (
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
        )}
      </div>

      {/* State chips */}
      <div className="flex gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
        <Badge variant="neutral">Reserve {reservePct.toFixed(0)}%</Badge>
        {position.de_risked ? (
          <Badge variant="warn">De-risk fired</Badge>
        ) : position.state === "active" ? (
          <Badge variant="neutral">De-risk armed</Badge>
        ) : position.state === "degraded" ? (
          <Badge variant="down">Recover available</Badge>
        ) : null}
      </div>
    </Link>
  );
}
