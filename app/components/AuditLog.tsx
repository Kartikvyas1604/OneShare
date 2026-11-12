import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { AuditEntry } from "@/app/lib/data";
import { EXPLORERS } from "@/app/lib/constants";
import { formatDate, truncateAddress } from "@/app/lib/utils";
import { ArrowRightLeft, ShieldCheck, TrendingDown, Activity } from "lucide-react";

const actionIcons: Record<string, React.ElementType> = {
  Bought: ArrowRightLeft,
  StopExecuted: TrendingDown,
  TpExecuted: TrendingDown,
  DcaExecuted: ArrowRightLeft,
  PriceUpdate: Activity,
};

const actionLabels: Record<string, string> = {
  Bought: "Bought NVDAx",
  StopExecuted: "Stop-loss executed",
  TpExecuted: "Take-profit partial sell",
  DcaExecuted: "DCA purchase",
  PriceUpdate: "Price update",
};

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-400" aria-hidden />
          Audit log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const Icon = actionIcons[entry.action] ?? Activity;
            const label = actionLabels[entry.action] ?? entry.action;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-brand-300" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.ts)}</p>
                  {entry.tx_sig && (
                    <a
                      href={`${EXPLORERS.solana.mainnet}/tx/${entry.tx_sig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-brand-300 hover:text-brand-200"
                    >
                      Tx: {truncateAddress(entry.tx_sig, 6)}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
