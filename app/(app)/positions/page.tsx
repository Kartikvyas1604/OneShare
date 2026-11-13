"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { ErrorState } from "@/app/components/ErrorState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { useWallet } from "@/app/components/wallet/WalletProvider";
import { useLivePrices } from "@/app/lib/prices";
import { VAULT_CONTRACT_ID, type VaultPosition } from "@/app/lib/vault";
import { navQuote, worstCaseQuote } from "@/app/lib/floorline";
import { formatUsd } from "@/app/lib/utils";
import { Layers } from "lucide-react";

export default function PositionsPage() {
  const { accountId, connecting: walletLoading, showConnect } = useWallet();
  const { prices, loading: pricesLoading } = useLivePrices();
  const [result, setResult] = useState<{ account: string; positions: VaultPosition[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);

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
        setResult({ account: accountId, positions: body.positions ?? [] });
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

  const loading =
    walletLoading || pricesLoading || (accountId !== null && result === null && !error);
  const price = prices.get("nep141:wrap.near")?.price;
  // Only render positions fetched for the connected account (no stale flashes).
  const list = result && result.account === accountId ? result.positions : [];

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <Header />
        <ErrorState
          title={notDeployed ? "The vault contract is not deployed yet" : "Couldn't load positions"}
          description={`${error} · reads go to ${VAULT_CONTRACT_ID} on NEAR mainnet. Nothing is simulated here — the list fills with real positions the moment the contract is live.`}
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
      <div className="mx-auto max-w-xl space-y-8">
        <Header />
        <EmptyState
          icon={Layers}
          title="Connect a NEAR wallet"
          description="Positions are read straight from the vault contract for your account — connect a wallet to see the real list."
          action={{ label: "Connect wallet", onClick: showConnect }}
        />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <Header />
        <EmptyState
          icon={Layers}
          title="No positions on-chain yet"
          description={`The vault contract holds no positions for ${accountId}. Create the first one with a real deposit from any chain.`}
          action={{ label: "Create your first position", href: "/create" }}
        />
      </div>
    );
  }

  let deposited = 0;
  let navTotal = 0;
  let worstTotal = 0;
  for (const p of list) {
    deposited += p.deposit_amount;
    navTotal += price !== undefined ? navQuote(p, price) : 0;
    worstTotal += worstCaseQuote(p);
  }

  return (
    <div className="space-y-8">
      <Header />

      {/* Summary — computed from real on-chain positions and the live price */}
      <section className="animate-fade-up grid grid-cols-2 divide-border rounded-xl border border-border bg-card sm:grid-cols-4 sm:divide-x">
        <Cell label="Total NAV" value={price !== undefined ? formatUsd(navTotal / 1e6) : "—"} />
        <Cell
          label="Reserve escrowed"
          value={formatUsd(list.reduce((s, p) => s + p.floor_amount, 0) / 1e6)}
        />
        <Cell label="Worst case" value={formatUsd(worstTotal / 1e6)} />
        <Cell label="Deposited" value={formatUsd(deposited / 1e6)} />
      </section>

      {/* List */}
      <section className="animate-fade-up delay-100 space-y-2.5">
        {list.map((p) => (
          <PositionCard key={p.id} position={p} currentPrice={price} />
        ))}
      </section>

      <p className="animate-fade-up delay-200 text-center text-[11px] text-muted-foreground">
        Read live from {VAULT_CONTRACT_ID} · NEP-171 transfer: settle pays whoever holds the token.
      </p>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">Portfolio</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">Positions</h1>
      </div>
      <Button href="/create">New position</Button>
    </header>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <p className="eyebrow">{label}</p>
      <p className="num mt-1 text-right text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  );
}
