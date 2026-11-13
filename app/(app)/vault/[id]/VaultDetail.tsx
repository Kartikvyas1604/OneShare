"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { Badge } from "@/app/components/Badge";
import { CopyButton } from "@/app/components/CopyButton";
import { ErrorState } from "@/app/components/ErrorState";
import { AuditLog, type ChainTxn } from "@/app/components/AuditLog";
import { StateBadge } from "@/app/components/vault/StateBadge";
import { AttestationBadge } from "@/app/components/vault/AttestationBadge";
import { useNearAccount } from "@/app/lib/wallet";
import { useLivePrices } from "@/app/lib/prices";
import { VAULT_CONTRACT_ID, type VaultPosition } from "@/app/lib/vault";
import {
  VAULT_CONFIG,
  navQuote,
  worstCaseQuote,
  unitValueQuote,
  drawdownBps,
  deRiskTriggered,
  entryPriceUsdc,
  riskAsset,
} from "@/app/lib/floorline";
import { formatUsd, formatTokenAmount, formatDate } from "@/app/lib/utils";
import { ChevronRight, ShieldCheck, TrendingDown, Lock, ArrowUpRight, ArrowDownRight } from "lucide-react";

type ActionKind = "settle" | "exit" | "recover";
type ActionPhase = "idle" | "working" | "done";

export function VaultDetail({ rawId }: { rawId: string }) {
  const { accountId, loading: walletLoading } = useNearAccount();
  const { prices, loading: pricesLoading } = useLivePrices();
  const [position, setPosition] = useState<VaultPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);
  const [txns, setTxns] = useState<ChainTxn[] | null>(null);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  const positionId = Number(rawId);
  const validId = Number.isInteger(positionId) && positionId >= 0;

  const loading = validId && position === null && error === null;

  // Real on-chain read by numeric token id. Every state update happens after
  // the awaited fetch — no synchronous setState in the effect body.
  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vault/position/${positionId}`);
        const body = (await res.json()) as {
          position?: VaultPosition;
          error?: string;
          notDeployed?: boolean;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error ?? `Vault read failed (${res.status})`);
          setNotDeployed(Boolean(body.notDeployed));
          return;
        }
        setPosition(body.position ?? null);
        setError(null);
        setNotDeployed(false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Vault read failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [positionId, validId]);

  // Real vault-account transactions from the indexer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/activity?account=${encodeURIComponent(VAULT_CONTRACT_ID)}`);
        const body = (await res.json()) as { txns?: ChainTxn[]; error?: string };
        if (!cancelled) setTxns(body.txns ?? []);
      } catch {
        if (!cancelled) setTxns([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runAction = async (kind: ActionKind) => {
    if (!position) return;
    if (!accountId) {
      setActionError("Connect an injected NEAR wallet first — actions sign against your account.");
      return;
    }
    setAction(kind);
    setPhase("working");
    setActionError(null);
    try {
      // Real transaction through the injected wallet; the chain's real result
      // (including failures while the contract is still undeployed) is shown.
      const injected = (
        window as {
          near?: {
            signAndSendTransaction?: (args: {
              signerId: string;
              receiverId: string;
              actions: Array<{ type: string; methodName?: string; args?: unknown; gas?: string; deposit?: string }>;
            }) => Promise<unknown>;
          };
        }
      ).near;
      if (!injected?.signAndSendTransaction) {
        throw new Error("The connected wallet cannot sign transactions in this browser.");
      }
      const method =
        kind === "settle" ? "settle" : kind === "exit" ? "exit_early" : "emergency_recover";
      await injected.signAndSendTransaction({
        signerId: accountId,
        receiverId: VAULT_CONTRACT_ID,
        actions: [
          { type: "FunctionCall", methodName: method, args: { position_id: position.id }, gas: "150000000000000", deposit: "0" },
        ],
      });
      setPhase("done");
    } catch (err) {
      setPhase("idle");
      setActionError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  if (!validId) {
    return (
      <ErrorState
        title="Position id is not valid"
        description={`Positions are addressed by their numeric NEP-171 token id — "${rawId}" doesn't resolve on ${VAULT_CONTRACT_ID}.`}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title={notDeployed ? "The vault contract is not deployed yet" : "Position unavailable"}
        description={`${error} · reads go to ${VAULT_CONTRACT_ID} on NEAR mainnet. Nothing is simulated — this page fills with real on-chain state the moment the contract is live.`}
      />
    );
  }

  if (loading || walletLoading || pricesLoading) {
    return (
      <div className="space-y-4">
        <div className="engraved rounded-2xl bg-card p-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            Reading {VAULT_CONTRACT_ID} on NEAR mainnet…
          </p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <ErrorState
        title="Position not found on-chain"
        description={`Token ${rawId} does not exist on ${VAULT_CONTRACT_ID}, or it settled and the NFT burned. Live positions are in the portfolio.`}
      />
    );
  }

  if (position.owner && accountId && position.owner !== accountId) {
    return (
      <ErrorState
        title="Connect the owner's wallet"
        description={`This position belongs to ${position.owner} on-chain; the connected account is ${accountId}.`}
      />
    );
  }

  const asset = riskAsset(position.risk_asset_id);
  const price = prices.get(position.risk_asset_id)?.price;
  const hasPrice = typeof price === "number";
  const nav = hasPrice ? navQuote(position, price) : null;
  const worst = worstCaseQuote(position);
  const cushion = hasPrice ? (nav as number) - position.floor_amount : null;
  const pnl = hasPrice ? (nav as number) - position.deposit_amount : null;
  const pnlPct = pnl !== null && position.deposit_amount > 0 ? pnl / position.deposit_amount : null;
  const isPositive = (pnl ?? 0) >= 0;
  const bucketValue = hasPrice ? unitValueQuote(position.risk_units, price) : null;
  const drawdown = hasPrice ? drawdownBps(position, price) : 0;
  const triggerArmed = hasPrice ? deRiskTriggered(position, price) : false;
  const entry = entryPriceUsdc(position);

  const actionBusy = phase === "working";
  const canSettle = position.state === "matured";
  const canExit = position.state === "open" || position.state === "active";
  const canRecover = position.state === "degraded";

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/positions" className="transition-colors hover:text-foreground focus-visible:outline-none">
          Positions
        </Link>
        <ChevronRight className="h-3 w-3 text-faint" aria-hidden />
        <span className="text-foreground">{asset.symbol}</span>
      </nav>

      {/* Header */}
      <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="num flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground">
            {asset.symbol.slice(0, 2)}
          </div>
          <div>
            <h1 className="display text-3xl text-foreground">{asset.symbol} position</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StateBadge state={position.state} />
              <span className="num text-[11px] text-muted-foreground">
                NEP-171 · token #{position.id}
              </span>
              {position.owner && (
                <CopyButton value={position.owner} label={position.owner} />
              )}
            </div>
          </div>
        </div>

        {/* Actions — real transactions through the connected wallet */}
        <div className="flex flex-wrap gap-2">
          {phase === "done" && action === "settle" && (
            <p className="num animate-fade-in self-center text-[13px] font-medium text-up">
              Settle confirmed on-chain
            </p>
          )}
          {phase === "done" && action !== "settle" && (
            <p className="num animate-fade-in self-center text-[13px] font-medium text-up">
              {action === "exit" ? "Early exit" : "Emergency recover"} confirmed on-chain
            </p>
          )}
          {phase !== "done" && (
            <>
              {canSettle && (
                <Button size="md" onClick={() => void runAction("settle")} isLoading={actionBusy}>
                  Settle
                </Button>
              )}
              {canExit && (
                <Button size="md" variant="secondary" onClick={() => void runAction("exit")} isLoading={actionBusy}>
                  Exit early
                </Button>
              )}
              {canRecover && (
                <Button size="md" variant="sell" onClick={() => void runAction("recover")} isLoading={actionBusy}>
                  Emergency recover
                </Button>
              )}
              {!canSettle && !canExit && !canRecover && (
                <Badge variant="neutral">Settled · NFT burned</Badge>
              )}
            </>
          )}
        </div>
      </header>
      {actionError && (
        <ErrorState title="Transaction rejected" description={actionError} />
      )}

      {/* Value — live price × on-chain state */}
      <section className="animate-fade-up delay-75">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="num text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {hasPrice ? formatUsd((nav as number) / 1e6) : "—"}
          </span>
          {pnlPct !== null && (
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
              {`${pnlPct >= 0 ? "+" : "−"}${Math.abs(pnlPct * 100).toFixed(2)}%`}
            </span>
          )}
        </div>
        <p className="num mt-2 text-[13px] text-muted-foreground">
          Worst case <span className="font-semibold text-foreground">{formatUsd(worst / 1e6)}</span>
          {cushion !== null && (
            <>
              {" "}· cushion {formatUsd(cushion / 1e6)}
            </>
          )}{" "}
          · deposited {formatUsd(position.deposit_amount / 1e6)} · price{" "}
          {hasPrice ? `$${price?.toFixed(4)}` : "—"} live from 1Click
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <Stat
            label="Reserve"
            value={formatUsd(position.floor_amount / 1e6)}
            sub={`escrow · ${VAULT_CONFIG.escrowAccount}`}
          />
          <Stat
            label="Risk bucket"
            value={bucketValue !== null ? formatUsd(bucketValue / 1e6) : "—"}
            sub={
              position.risk_units > 0
                ? `${formatTokenAmount(position.risk_units, 4)} ${asset.symbol} @ $${entry.toFixed(2)} entry`
                : "no units yet"
            }
          />
          <Stat
            label="Cost basis"
            value={position.cost_basis > 0 ? formatUsd(position.cost_basis / 1e6) : "—"}
            sub={
              position.realised_quote > 0
                ? `${formatUsd(position.realised_quote / 1e6)} realised`
                : "all at risk"
            }
          />
          <Stat label="Matures" value={formatDate(position.matures_at)} sub="UTC · payout = NAV" />
        </dl>
      </section>

      {/* De-risk rule */}
      <section className="animate-fade-up delay-100">
        <div className="engraved rounded-2xl bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-faint" aria-hidden />
              <p className="text-[13px] font-medium text-foreground">De-risk rule</p>
            </div>
            {position.de_risked ? (
              <Badge variant="warn">
                <Lock className="h-3 w-3" aria-hidden />
                Fired · single-shot locked
              </Badge>
            ) : (
              <Badge variant={triggerArmed ? "down" : "neutral"}>
                {triggerArmed ? "Trigger crossed · settling" : "Armed · single-shot"}
              </Badge>
            )}
          </div>

          <div className="px-4 py-4">
            {position.de_risked ? (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                The risk bucket sold at the trigger;{" "}
                <span className="num font-medium text-foreground">
                  {formatUsd(position.realised_quote / 1e6)}
                </span>{" "}
                realised. Proceeds are locked until maturity (I6) — the rule never re-enters.
              </p>
            ) : position.cost_basis > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Drawdown from cost basis</span>
                  <span className={`num font-medium ${drawdown > 0 ? "text-down" : "text-foreground"}`}>
                    −{(drawdown / 100).toFixed(1)}%
                  </span>
                </div>
                <div
                  className="relative h-1.5 overflow-hidden rounded-full bg-secondary"
                  role="meter"
                  aria-valuenow={Math.round(drawdown / 100)}
                  aria-valuemin={0}
                  aria-valuemax={VAULT_CONFIG.deRiskTriggerBps / 100}
                  aria-label="Drawdown toward the de-risk trigger"
                >
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${triggerArmed ? "bg-down" : drawdown > 0 ? "bg-warning" : "bg-up"}`}
                    style={{ width: `${Math.min(100, (drawdown / VAULT_CONFIG.deRiskTriggerBps) * 100)}%` }}
                  />
                </div>
                <p className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Value now{" "}
                    <span className="num text-foreground">{formatUsd((bucketValue ?? 0) / 1e6)}</span> ·
                    cost <span className="num text-foreground">{formatUsd(position.cost_basis / 1e6)}</span>
                  </span>
                  <span className="num">trigger −{(VAULT_CONFIG.deRiskTriggerBps / 100).toFixed(0)}%</span>
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  One shot only (I6): if the bucket falls 50% below what it cost, the keeper sells
                  all of it and locks the proceeds. It never re-enters.
                </p>
              </div>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Arms after the first buy settles. The keeper sells the whole risk bucket if it
                falls{" "}
                <span className="num text-foreground">−{(VAULT_CONFIG.deRiskTriggerBps / 100).toFixed(0)}%</span>{" "}
                from cost — once (I6).
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Keeper & attestation */}
      <section className="animate-fade-up delay-150">
        <div className="engraved rounded-2xl bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-faint" aria-hidden />
              <p className="text-[13px] font-medium text-foreground">Keeper &amp; attestation</p>
            </div>
            <AttestationBadge status="pending" />
          </div>
          <p className="px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
            The de-risk decision runs on NEAR AI Cloud inside a TEE. The attestation comes from the
            keeper&apos;s <span className="num">/v1/attestation/:id</span> endpoint once that flow
            verifies end-to-end; until then the local rule (formula 6) executes and the badge stays
            pending — it is never faked with a placeholder hash.
          </p>
        </div>
      </section>

      {/* Events — real vault transactions from the indexer */}
      <section className="animate-fade-up delay-200">
        <AuditLog txns={txns ?? []} loading={txns === null} account={VAULT_CONTRACT_ID} />
      </section>

      <p className="text-[11px] leading-relaxed text-faint">
        Demo build · vault {VAULT_CONFIG.vaultAccount} · escrow {VAULT_CONFIG.escrowAccount} · fees
        off for the hackathon. No leverage, no liquidation — the reserve caps the loss.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="num mt-1 text-sm font-semibold text-foreground">{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</dd>}
    </div>
  );
}
