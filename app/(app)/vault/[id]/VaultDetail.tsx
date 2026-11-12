"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { Badge } from "@/app/components/Badge";
import { CopyButton } from "@/app/components/CopyButton";
import { ErrorState } from "@/app/components/ErrorState";
import { AuditLog } from "@/app/components/AuditLog";
import { StateBadge } from "@/app/components/vault/StateBadge";
import { AttestationBadge } from "@/app/components/vault/AttestationBadge";
import {
  MOCK_POSITIONS,
  RISK_PRICE_USDC,
  VAULT_CONFIG,
  eventsFor,
  navQuote,
  worstCaseQuote,
  unitValueQuote,
  drawdownBps,
  deRiskTriggered,
  earlyExitPayout,
  entryPriceUsdc,
  riskAsset,
  type FloorlinePosition,
} from "@/app/lib/floorline";
import { getSessionPosition } from "@/app/lib/session-positions";
import { formatUsd, formatTokenAmount, formatDate, sleep } from "@/app/lib/utils";
import { ChevronRight, ShieldCheck, TrendingDown, Lock, ArrowUpRight, ArrowDownRight } from "lucide-react";

/** Mock connected wallet — matches the AppShell wallet card. */
const MOCK_WALLET = "priya.near";

type ActionKind = "settle" | "exit" | "recover";
type ActionPhase = "idle" | "working" | "done";

function resolvePosition(raw: string): FloorlinePosition | undefined {
  const key = raw.toLowerCase().replace(/^0x/, "");
  return (
    MOCK_POSITIONS.find((p) => p.hex_id.toLowerCase().replace(/^0x/, "") === key) ??
    MOCK_POSITIONS.find((p) => String(p.id) === raw) ??
    getSessionPosition(raw)
  );
}

export function VaultDetail({ rawId }: { rawId: string }) {
  const [action, setAction] = useState<ActionKind | null>(null);
  const [phase, setPhase] = useState<ActionPhase>("idle");

  const position = resolvePosition(rawId);

  if (!position) {
    return (
      <ErrorState
        title="Position not found"
        description="This token may be settled (NFT burned) or the id is incorrect. Your live positions are in the portfolio."
      />
    );
  }

  if (position.owner !== MOCK_WALLET) {
    return (
      <ErrorState
        title="Connect to manage this position"
        description={`The vault page reads onchain state for the connected wallet. This position belongs to ${position.owner}.`}
      />
    );
  }

  const asset = riskAsset(position.risk_asset_id);
  const price = RISK_PRICE_USDC;
  const nav = navQuote(position, price);
  const worst = worstCaseQuote(position);
  const cushion = nav - position.floor_amount;
  const pnl = nav - position.deposit_amount;
  const pnlPct = position.deposit_amount > 0 ? pnl / position.deposit_amount : 0;
  const isPositive = pnl >= 0;
  const bucketValue = unitValueQuote(position.risk_units, price);
  const drawdown = drawdownBps(position, price);
  const triggerArmed = deRiskTriggered(position, price);
  const entry = entryPriceUsdc(position);

  const runAction = async (kind: ActionKind) => {
    setAction(kind);
    setPhase("working");
    await sleep(1_400);
    setPhase("done");
  };

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
              <CopyButton value={position.hex_id} label={position.hex_id.slice(0, 10) + "…"} />
            </div>
          </div>
        </div>

        {/* Actions — contextual per state */}
        <div className="flex flex-wrap gap-2">
          {phase === "done" && action === "settle" && (
            <p className="num animate-fade-in self-center text-[13px] font-medium text-up">
              {formatUsd(nav / 1e6)} payout sent · NFT burned
            </p>
          )}
          {phase === "done" && action === "exit" && (
            <p className="num animate-fade-in self-center text-[13px] font-medium text-foreground">
              Exited early · {formatUsd(earlyExitPayout(position, price) / 1e6)} after fee
            </p>
          )}
          {phase === "done" && action === "recover" && (
            <p className="num animate-fade-in self-center text-[13px] font-medium text-up">
              Reserve returned · NFT burned
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

      {/* Value */}
      <section className="animate-fade-up delay-75">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="num text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {formatUsd(nav / 1e6)}
          </span>
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
        </div>
        <p className="num mt-2 text-[13px] text-muted-foreground">
          Worst case{" "}
          <span className="font-semibold text-foreground">{formatUsd(worst / 1e6)}</span> · cushion{" "}
          {formatUsd(cushion / 1e6)} · deposited {formatUsd(position.deposit_amount / 1e6)}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <Stat
            label="Reserve"
            value={formatUsd(position.floor_amount / 1e6)}
            sub={`escrow · ${VAULT_CONFIG.escrowAccount}`}
          />
          <Stat
            label="Risk bucket"
            value={formatUsd(bucketValue / 1e6)}
            sub={
              position.risk_units > 0
                ? `${formatTokenAmount(position.risk_units, 4)} ${asset.symbol} @ $${entry.toFixed(2)}`
                : "no units yet"
            }
          />
          <Stat
            label="Cost basis"
            value={position.cost_basis > 0 ? formatUsd(position.cost_basis / 1e6) : "—"}
            sub={position.realised_quote > 0 ? `${formatUsd(position.realised_quote / 1e6)} realised` : "all at risk"}
          />
          <Stat label="Matures" value={formatDate(position.matures_at)} sub="UTC · payout = NAV" />
        </dl>
      </section>

      {/* De-risk rule */}
      <section className="animate-fade-up delay-100">
        <div className="rounded-xl border border-border bg-card">
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
                    <span className="num text-foreground">{formatUsd(bucketValue / 1e6)}</span> · cost{" "}
                    <span className="num text-foreground">{formatUsd(position.cost_basis / 1e6)}</span>
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
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-faint" aria-hidden />
              <p className="text-[13px] font-medium text-foreground">Keeper &amp; attestation</p>
            </div>
            <AttestationBadge
              status={position.de_risked ? "attested" : "pending"}
              hash={position.de_risked ? "ed25519:3kQ4xYz9p…mV2r" : undefined}
            />
          </div>
          <p className="px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
            The de-risk decision runs on NEAR AI Cloud inside a TEE; the attestation hash is bound
            to this position. Until the TEE flow verifies end-to-end, the local rule (formula 6)
            executes and the badge stays pending — it is never faked.
          </p>
        </div>
      </section>

      {/* Events */}
      <section className="animate-fade-up delay-200">
        <AuditLog entries={eventsFor(position.id)} />
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
