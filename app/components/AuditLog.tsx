import { AuditEntry } from "@/app/lib/data";
import { EXPLORERS } from "@/app/lib/constants";
import { formatDate, truncateAddress } from "@/app/lib/utils";
import { ArrowRightLeft, ShieldCheck, TrendingDown, Activity } from "lucide-react";

const actionMeta: Record<string, { label: string; icon: React.ElementType }> = {
  Bought: { label: "Bought NVDAx", icon: ArrowRightLeft },
  StopExecuted: { label: "Stop-loss executed", icon: TrendingDown },
  TpExecuted: { label: "Take-profit partial sell", icon: TrendingDown },
  DcaExecuted: { label: "DCA purchase", icon: ArrowRightLeft },
  PriceUpdate: { label: "Price refresh", icon: Activity },
};

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <ShieldCheck className="h-3.5 w-3.5 text-faint" aria-hidden />
        <h3 className="eyebrow">Audit log</h3>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {entries.map((entry, idx) => {
            const meta = actionMeta[entry.action] ?? { label: entry.action, icon: Activity };
            return (
              <li key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <meta.icon
                  className={`h-4 w-4 shrink-0 ${
                    entry.action.includes("Stop") ? "text-down" : "text-faint"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{meta.label}</p>
                  <p className="num text-[11px] text-muted-foreground">{formatDate(entry.ts)} UTC</p>
                </div>
                {entry.tx_sig && (
                  <a
                    href={`${EXPLORERS.solana.mainnet}/tx/${entry.tx_sig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="num shrink-0 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {truncateAddress(entry.tx_sig, 4)}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
