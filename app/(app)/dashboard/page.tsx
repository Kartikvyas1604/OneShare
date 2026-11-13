"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ErrorState } from "@/app/components/ErrorState";
import type { ChainTxn } from "@/app/components/AuditLog";
import { useNearAccount } from "@/app/lib/wallet";
import { useLivePrices } from "@/app/lib/prices";
import {
  VAULT_CONTRACT_ID,
  type VaultPosition,
} from "@/app/lib/vault";
import { VAULT_CONFIG } from "@/app/lib/floorline";
import { EXPLORERS } from "@/app/lib/constants";
import { navQuote, worstCaseQuote } from "@/app/lib/floorline";
import { formatUsd, formatPercent, formatDate, timeAgoLabel } from "@/app/lib/utils";
import { ArrowRightLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function DashboardPage() {
  const { accountId, loading: walletLoading } = useNearAccount();
  const { prices, loading: pricesLoading } = useLivePrices();
  const [positions, setPositions] = useState<VaultPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);
  const [txns, setTxns] = useState<ChainTxn[] | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vault/positions?account=${encodeURIComponent(accountId)}`);
        const body = (await res.json()) as {
          positions?: VaultPosition[];
          error?: string;
          notDeployed?: boolean;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error ?? `Vault read failed (${res.status})`);
          setNotDeployed(Boolean(body.notDeployed));
          return;
        }
        setPositions(body.positions ?? []);
        setError(null);
        setNotDeployed(false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Vault read failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/activity?account=${encodeURIComponent(VAULT_CONTRACT_ID)}`);
        const body = (await res.json()) as { txns?: ChainTxn[] };
        if (!cancelled) setTxns(body.txns ?? []);
      } catch {
        if (!cancelled) setTxns([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading =
    walletLoading || pricesLoading || (accountId !== null && positions === null && !error);
  const price = prices.get("nep141:wrap.near")?.price;
  const list = positions ?? [];

  if (error) {
    return (
      <div className="space-y-10">
        <Header />
        <ErrorState
          title={notDeployed ? "The vault contract is not deployed yet" : "Couldn't load your portfolio"}
          description={`${error} · reads go to ${VAULT_CONTRACT_ID} on NEAR mainnet. Nothing is simulated — the overview fills with real state once the contract is live.`}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Header />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="space-y-10">
        <Header />
        <EmptyState
          icon={ArrowRightLeft}
          title="Connect a NEAR wallet"
          description="The overview reads your positions straight from the vault contract — connect an injected NEAR wallet to load the real portfolio."
          action={{ label: "Open a wallet in this browser", href: "/dashboard" }}
        />
      </div>
    );
  }

  let deposited = 0;
  let navTotal = 0;
  let worstTotal = 0;
  let reserveTotal = 0;
  for (const p of list) {
    deposited += p.deposit_amount;
    if (price !== undefined) navTotal += navQuote(p, price);
    worstTotal += worstCaseQuote(p);
    reserveTotal += p.floor_amount;
  }
  const pnl = navTotal - deposited;
  const pnlPct = deposited > 0 ? pnl / deposited : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-10">
      <Header />

      {/* Value — real on-chain positions × live 1Click price */}
      <section className="animate-fade-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Total NAV</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="num text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {price !== undefined ? formatUsd(navTotal / 1e6) : "—"}
              </span>
              {list.length > 0 && price !== undefined && (
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
              )}
            </div>
            <p className="num mt-2 text-[13px] text-muted-foreground">
              {formatUsd(deposited / 1e6)} deposited · {formatUsd(reserveTotal / 1e6)} escrowed ·
              worst case {formatUsd(worstTotal / 1e6)}
            </p>
          </div>

          {/* NAV history needs the vault's checkpoint feed — honest until then */}
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="eyebrow">NAV history</p>
            <p className="mt-1 max-w-56 text-[11px] leading-relaxed text-muted-foreground">
              Starts after the vault records its first on-chain checkpoint. No history is
              simulated.
            </p>
          </div>
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
        {list.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="No positions on-chain yet"
            description={`The vault holds no positions for ${accountId}. Create the first one with a real deposit.`}
            action={{ label: "Create your first position", href: "/create" }}
          />
        ) : (
          <div className="space-y-2.5">
            {list.slice(0, 3).map((p) => (
              <PositionCard key={p.id} position={p} currentPrice={price} />
            ))}
          </div>
        )}
      </section>

      {/* Activity — real indexer txs for the vault account */}
      <section className="animate-fade-up delay-200">
        <h2 className="eyebrow mb-3 px-0.5">Vault activity</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {txns === null ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              Reading the indexer…
            </p>
          ) : txns.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              No transactions for <span className="num text-foreground">{VAULT_CONTRACT_ID}</span>{" "}
              yet — activity appears as the vault transacts on mainnet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {txns.slice(0, 5).map((t) => (
                <li key={t.hash} className="flex items-center gap-3 px-4 py-3.5">
                  <ArrowRightLeft
                    className={`h-4 w-4 shrink-0 ${t.ok ? "text-faint" : "text-down"}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="num truncate text-[13px] font-medium text-foreground">
                      {t.from} → {t.to}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {timeAgoLabel(t.ts)} · {formatDate(t.ts)} UTC
                    </p>
                  </div>
                  <a
                    href={`${EXPLORERS.near.mainnet}/tx/${t.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="num shrink-0 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Tx
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-faint">
        Vault {VAULT_CONFIG.vaultAccount} · reserve at {VAULT_CONFIG.escrowAccount} · fees off for
        the hackathon.
      </p>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">Portfolio</h1>
      </div>
      <Button href="/create">New position</Button>
    </header>
  );
}
