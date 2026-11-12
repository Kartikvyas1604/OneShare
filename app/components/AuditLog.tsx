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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.ts)}</p>
                  {entry.tx_sig && (
                    <a
                      href={`${EXPLORERS.solana.mainnet}/tx/${entry.tx_sig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
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
