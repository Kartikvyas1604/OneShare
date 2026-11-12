import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Badge } from "./Badge";
import { Position, Ticker } from "@/app/lib/data";
import { formatUsd, formatPercent, formatTokenAmount, truncateAddress } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

interface PositionCardProps {
  position: Position;
  ticker: Ticker;
  currentPrice: number;
}

const stateLabels: Record<Position["state"], string> = {
  created: "Created",
  funding: "Funding",
  buying: "Buying",
  active: "Active",
  selling: "Selling",
  closed: "Closed",
  withdrawn: "Withdrawn",
  refunding: "Refunding",
};

function pnlFor(position: Position, currentPrice: number) {
  const usdcInTotal = position.usdc_in / 1e6;
  // Simplified PnL calculation for display
  const entryPrice = position.entry_px / 1e6;
  const shares = position.usdc_in / entryPrice / 1e6;
  const value = shares * currentPrice;
  const pnl = value - usdcInTotal;
  const pnlPct = usdcInTotal > 0 ? pnl / usdcInTotal : 0;
  return { pnl, pnlPct, value };
}

export function PositionCard({ position, ticker, currentPrice }: PositionCardProps) {
  const { pnl, pnlPct, value } = pnlFor(position, currentPrice);
  const isPositive = pnl >= 0;
  const isActive = position.state === "active";

  return (
    <Link href={`/positions/${position.id}`} className="group block focus-visible:outline-none">
      <Card className="transition-all duration-200 hover:border-brand-500/30 hover:shadow-glow-brand">
        <CardHeader className="mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-950 text-brand-300">
              <Wallet className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-sm">{ticker.symbol}</CardTitle>
              <CardDescription className="mt-0.5">
                {truncateAddress(position.derived_sol, 4)}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? "success" : position.state === "closed" ? "secondary" : "warning"}>
            {stateLabels[position.state]}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Value
              </p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground">
                {formatUsd(value)}
              </p>
            </div>
            {isActive && (
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  PnL
                </p>
                <div
                  className={`mt-0.5 inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums ${
                    isPositive ? "text-success" : "text-destructive"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {formatPercent(pnlPct, { sign: true })}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Invested
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatUsd(position.usdc_in / 1e6)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Shares
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatTokenAmount(position.nvdax_amount / 1e6)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
