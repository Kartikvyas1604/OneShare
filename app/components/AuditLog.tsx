import { EXPLORERS } from "@/app/lib/constants";
import { formatDate, truncateAddress } from "@/app/lib/utils";
import { ShieldCheck, Activity } from "lucide-react";

export interface ChainTxn {
  hash: string;
  ts: number;
  to: string;
  from: string;
  ok: boolean;
}

/**
 * Real transaction history for a NEAR account, fetched from the nearblocks
 * indexer via /api/activity. No fabricated events: whatever the chain shows
 * is what renders, with an honest note when the indexer has nothing yet.
 */
export function AuditLog({
  txns,
  loading,
  account,
}: {
  txns: ChainTxn[];
  loading?: boolean;
  account: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <ShieldCheck className="h-3.5 w-3.5 text-faint" aria-hidden />
        <h3 className="eyebrow">Vault transactions</h3>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            Reading the indexer…
          </p>
        ) : txns.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            No transactions for <span className="num text-foreground">{account}</span> yet — the
            feed fills with real history as the vault transacts.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {txns.map((t) => (
              <li key={t.hash} className="flex items-center gap-3 px-4 py-3.5">
                <Activity
                  className={`h-4 w-4 shrink-0 ${t.ok ? "text-faint" : "text-down"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="num truncate text-[13px] font-medium text-foreground">
                    {t.from} → {t.to}
                  </p>
                  <p className="num text-[11px] text-muted-foreground">{formatDate(t.ts)} UTC</p>
                </div>
                <a
                  href={`${EXPLORERS.near.mainnet}/tx/${t.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="num shrink-0 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {truncateAddress(t.hash, 4)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
