import type { VaultEvent, VaultEventName } from "@/app/lib/floorline";
import { EXPLORERS } from "@/app/lib/constants";
import { formatDate, truncateAddress } from "@/app/lib/utils";
import {
  ArrowRightLeft,
  ShieldCheck,
  TrendingDown,
  Activity,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const eventMeta: Record<VaultEventName, { icon: React.ElementType; tone?: "down" | "up" }> = {
  Deposited: { icon: ArrowRightLeft },
  ReserveEscrowed: { icon: Lock },
  BuyAuthorized: { icon: Activity },
  BuySettled: { icon: CheckCircle2, tone: "up" },
  DeRiskTriggered: { icon: TrendingDown, tone: "down" },
  DeRiskSettled: { icon: TrendingDown, tone: "down" },
  PositionSettled: { icon: CheckCircle2, tone: "up" },
  PositionDegraded: { icon: AlertTriangle, tone: "down" },
  PositionTransferred: { icon: ArrowRightLeft },
  PausedSet: { icon: Activity },
};

export function AuditLog({ entries }: { entries: VaultEvent[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <ShieldCheck className="h-3.5 w-3.5 text-faint" aria-hidden />
        <h3 className="eyebrow">Vault events</h3>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {entries.map((entry, idx) => {
            const meta = eventMeta[entry.name] ?? { icon: Activity };
            return (
              <li key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <meta.icon
                  className={`h-4 w-4 shrink-0 ${
                    meta.tone === "down" ? "text-down" : meta.tone === "up" ? "text-up" : "text-faint"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    <span className="num">{entry.name}</span>
                    <span className="ml-2 font-normal text-muted-foreground">{entry.detail}</span>
                  </p>
                  <p className="num text-[11px] text-muted-foreground">{formatDate(entry.ts)} UTC</p>
                </div>
                {entry.tx && (
                  <a
                    href={`${EXPLORERS.near.mainnet}/tx/${entry.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="num shrink-0 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {truncateAddress(entry.tx, 4)}
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
