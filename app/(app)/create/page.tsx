"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { ChainBadge } from "@/app/components/ChainBadge";
import { CopyButton } from "@/app/components/CopyButton";
import { Badge } from "@/app/components/Badge";
import { Slider } from "@/app/components/Slider";
import { ErrorState } from "@/app/components/ErrorState";
import { Check, ChevronDown, CircleDot, RefreshCw } from "lucide-react";
import {
  RISK_ASSETS,
  VAULT_CONFIG,
  splitDeposit,
  targetUnits,
  riskAsset,
} from "@/app/lib/floorline";
import { useLivePrices } from "@/app/lib/prices";
import { useWallet } from "@/app/components/wallet/WalletProvider";
import { formatUsd, formatTokenAmount } from "@/app/lib/utils";

type CreateState = "config" | "quoting" | "quoted" | "submitting" | "funding" | "settled";

const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED", "REFUNDED", "INCOMPLETE_DEPOSIT"]);

const TERMS = [
  { label: "7 days", seconds: 604_800 },
  { label: "30 days", seconds: 2_592_000 },
  { label: "90 days", seconds: 7_776_000 },
] as const;

interface RealQuote {
  amountIn?: string;
  amountInUsd?: string;
  amountOut?: string;
  amountOutFormatted?: string;
  amountOutUsd?: string;
  minAmountOut?: string;
  timeEstimate?: number;
}

export default function CreatePage() {
  const { accountId } = useWallet();
  const { prices } = useLivePrices();
  const [state, setState] = useState<CreateState>("config");
  const [amount, setAmount] = useState("100");
  const [amountTouched, setAmountTouched] = useState(false);
  const [floorBps, setFloorBps] = useState<number>(VAULT_CONFIG.floorRatioBps);
  const [termSeconds, setTermSeconds] = useState<number>(VAULT_CONFIG.termSeconds);
  const [assetId, setAssetId] = useState<string>(VAULT_CONFIG.riskAssetId);
  const [error, setError] = useState<string | null>(null);

  const [quote, setQuote] = useState<RealQuote | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [chainAddresses, setChainAddresses] = useState<
    Array<{ blockchain?: string; depositAddress?: string; memo?: string }>
  >([]);
  const [status, setStatus] = useState<string | null>(null);
  const [remediation, setRemediation] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const asset = riskAsset(assetId);
  const livePrice = prices.get(assetId)?.price;
  const parsedUsdc = Number(amount) || 0;
  const depositMicro = Math.round(parsedUsdc * 1e6);
  const { floorAmount, riskBudget } = splitDeposit(depositMicro, floorBps);
  const units = livePrice !== undefined ? targetUnits(riskBudget, livePrice) : null;

  const amountError = (() => {
    if (!amountTouched) return undefined;
    if (parsedUsdc < VAULT_CONFIG.minDeposit / 1e6)
      return `Minimum deposit is ${VAULT_CONFIG.minDeposit / 1e6} USDC.`;
    if (depositMicro > VAULT_CONFIG.maxTvl) return "Above the vault's 100,000 USDC cap.";
    return undefined;
  })();

  const canReview = !amountError && parsedUsdc > 0;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const review = async () => {
    setAmountTouched(true);
    if (!canReview) return;
    setState("quoting");
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountMicro: depositMicro,
          destinationAsset: assetId,
          deadlineIso: new Date(Date.now() + 30 * 60_000).toISOString(),
        }),
      });
      const body = (await res.json()) as { quote?: RealQuote; error?: string };
      if (!res.ok || !body.quote) throw new Error(body.error ?? "Quote rejected");
      setQuote(body.quote);
      setState("quoted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
      setState("config");
    }
  };

  const confirmDeposit = async () => {
    setState("submitting");
    setError(null);
    setRemediation(null);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountMicro: depositMicro,
          ownerAccountId: accountId ?? VAULT_CONFIG.vaultAccount,
        }),
      });
      const body = (await res.json()) as {
        depositAddress?: string;
        chainDepositAddresses?: Array<{ blockchain?: string; depositAddress?: string; memo?: string }>;
        error?: string;
        remediation?: string;
      };
      if (!res.ok || !body.depositAddress) {
        setError(body.error ?? "Deposit address request rejected");
        setRemediation(body.remediation ?? null);
        setState("quoted");
        return;
      }
      setDepositAddress(body.depositAddress);
      setChainAddresses(body.chainDepositAddresses ?? []);
      setState("funding");
      // Poll the real 1Click status endpoint until a terminal state.
      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`/api/deposit/status?address=${encodeURIComponent(body.depositAddress as string)}`);
          const sb = (await s.json()) as { status?: string };
          if (sb.status) {
            setStatus(sb.status);
            if (TERMINAL_STATUSES.has(sb.status)) {
              if (pollRef.current) clearInterval(pollRef.current);
              if (sb.status === "SUCCESS") setState("settled");
            }
          }
        } catch {
          /* transient — the next tick retries for real */
        }
      }, 5_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit address request failed");
      setState("quoted");
    }
  };

  const retryStatus = () => {
    if (!depositAddress) return;
    setStatus(null);
    pollRef.current = setInterval(async () => {
      try {
        const s = await fetch(`/api/deposit/status?address=${encodeURIComponent(depositAddress)}`);
        const sb = (await s.json()) as { status?: string };
        if (sb.status) {
          setStatus(sb.status);
          if (TERMINAL_STATUSES.has(sb.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
            if (sb.status === "SUCCESS") setState("settled");
          }
        }
      } catch {
        /* retry next tick */
      }
    }, 5_000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Create</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">New position</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Real 1Click quote, real deposit address — the worst case in dollars before you send
          anything.
        </p>
      </header>

      {/* Progress */}
      {state !== "config" && (
        <ol className="flex items-center gap-2" aria-label="Progress">
          {(
            [
              { key: "quoted", label: "Quote" },
              { key: "funding", label: "Fund" },
              { key: "settled", label: "Settle" },
            ] as const
          ).map((step, idx) => {
            const order = ["config", "quoting", "quoted", "submitting", "funding", "settled"];
            const reached = order.indexOf(state) >= order.indexOf(step.key);
            return (
              <li key={step.key} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium ${
                    reached ? "bg-up-soft text-up" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {reached ? <Check className="h-3 w-3" aria-hidden /> : <CircleDot className="h-3 w-3" aria-hidden />}
                  {step.label}
                </span>
                {idx < 2 && <span className={`h-px flex-1 ${reached ? "bg-up/40" : "bg-border"}`} aria-hidden />}
              </li>
            );
          })}
        </ol>
      )}

      {/* Form card */}
      <section className="animate-fade-up engraved rounded-2xl bg-card">
        <div className="divide-y divide-border">
          {/* Pay with */}
          <div className="space-y-2 p-4">
            <span className="eyebrow">Pay with</span>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-input px-3.5 text-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Choose token and chain"
            >
              <span className="flex items-center gap-2">
                <ChainBadge chain="Base" />
                <span className="font-medium text-foreground">USDC</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Any of 30+ chains
                <ChevronDown className="h-4 w-4" aria-hidden />
              </span>
            </button>
          </div>

          {/* Risk asset */}
          <fieldset className="space-y-2 p-4">
            <legend className="eyebrow">Risk asset</legend>
            <div className="space-y-1.5" role="radiogroup" aria-label="Risk asset">
              {RISK_ASSETS.map((a) => {
                const selected = a.assetId === assetId;
                const live = prices.get(a.assetId);
                return (
                  <button
                    key={a.assetId}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!a.verified}
                    onClick={() => setAssetId(a.assetId)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? "border-border-strong bg-secondary"
                        : "border-border bg-transparent hover:border-border-strong"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`num flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-semibold ${
                          selected ? "border-border-strong bg-card text-foreground" : "border-border text-muted-foreground"
                        }`}
                        aria-hidden
                      >
                        {a.symbol.slice(0, 2)}
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium text-foreground">
                          {a.symbol}
                          <span className="ml-1.5 font-normal text-muted-foreground">{a.name}</span>
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{a.note}</span>
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Badge variant={a.verified ? "up" : "neutral"}>
                        {a.verified ? "Verified route" : "Route pending"}
                      </Badge>
                      {live && (
                        <span className="num text-[10px] text-muted-foreground">
                          ${live.price.toFixed(4)} live
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The equity route is gated (G-2) — this demo runs {asset.symbol} through the verified
              1Click fallback. Same mechanism, verified asset.
            </p>
          </fieldset>

          {/* Amount */}
          <div className="p-4">
            <Input
              id="amount"
              label="Deposit (USDC)"
              type="text"
              inputMode="decimal"
              spellCheck={false}
              autoComplete="off"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountTouched(true);
              }}
              error={amountError}
              hint={`Minimum ${VAULT_CONFIG.minDeposit / 1e6} USDC · funded from any chain`}
            />
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {["25", "100", "250", "1000"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setAmount(v);
                    setAmountTouched(true);
                  }}
                  className={`num h-10 rounded-lg border text-xs font-medium transition-colors duration-100 focus-visible:outline-none ${
                    amount === v
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Loss limit */}
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="loss-limit" className="eyebrow">
                Loss limit
              </label>
              <span className="num text-[13px] font-medium text-foreground">
                {(floorBps / 100).toFixed(0)}% kept
              </span>
            </div>
            <Slider
              value={[floorBps]}
              min={VAULT_CONFIG.floorRatioMinBps}
              max={VAULT_CONFIG.floorRatioMaxBps}
              step={VAULT_CONFIG.floorRatioStepBps}
              id="loss-limit"
              ariaLabel="Loss limit — share of the deposit held as reserve"
              onValueChange={(v) => setFloorBps(v[0])}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The reserve sits in a separate escrow contract. Worst case you keep{" "}
              <span className="num text-foreground">{(floorBps / 100).toFixed(0)}%</span> — max
              loss <span className="num text-foreground">{(100 - floorBps / 100).toFixed(0)}%</span>{" "}
              of the deposit.
            </p>
          </div>

          {/* Term */}
          <div className="p-4">
            <span className="eyebrow">Term</span>
            <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Term">
              {TERMS.map((t) => (
                <button
                  key={t.seconds}
                  type="button"
                  aria-pressed={termSeconds === t.seconds}
                  onClick={() => setTermSeconds(t.seconds)}
                  className={`num h-10 rounded-lg border text-xs font-medium transition-colors duration-100 focus-visible:outline-none ${
                    termSeconds === t.seconds
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live readout — real price, real split */}
          <div className="space-y-2.5 p-4">
            <div className="rounded-lg border border-border bg-input p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Worst case</span>
                <span className="num text-xl font-semibold text-foreground">
                  {formatUsd(floorAmount / 1e6)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Escrowed before the first buy — a number you set, not one the market sets.
              </p>
            </div>
            <Row label="Reserve (escrowed)" value={formatUsd(floorAmount / 1e6)} />
            <Row label="Risk budget" value={formatUsd(riskBudget / 1e6)} />
            <Row
              label={`Est. ${asset.symbol}`}
              value={
                units !== null && riskBudget > 0
                  ? `${formatTokenAmount(units, 4)} @ $${livePrice?.toFixed(4) ?? "—"} live`
                  : "—"
              }
            />
            <Row label="De-risk trigger" value="−50% from cost basis" />
            <Row label="Early exit fee" value={`${VAULT_CONFIG.earlyExitFeeBps / 100}%`} />
            <Row label="Fees" value="0% for the hackathon" />
          </div>

          {/* Actions — real 1Click rail */}
          <div className="p-4">
            {state === "config" && error && (
              <ErrorState title="Quote failed" description={error} className="mb-3" />
            )}
            {(state === "config" || state === "quoting") && (
              <Button
                className="w-full"
                size="lg"
                onClick={review}
                isLoading={state === "quoting"}
                disabled={!canReview}
              >
                {state === "quoting" ? "Requesting real quote…" : "Review deposit"}
              </Button>
            )}

            {(state === "config" || state === "quoting" || state === "quoted") && error && (
              <ErrorState
                title={state === "quoted" ? "Deposit address unavailable" : "Quote failed"}
                description={error}
                className="mb-3"
              />
            )}
            {state === "quoted" && remediation && (
              <p className="mb-3 rounded-lg border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-foreground">
                {remediation}
              </p>
            )}
            {state === "quoted" && quote && (
              <div className="animate-fade-in space-y-3">
                <dl className="space-y-2 rounded-lg border border-border bg-input p-3.5 text-[13px]">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">1Click quote · live</dt>
                    <dd className="num font-medium text-foreground">
                      {quote.timeEstimate !== undefined ? `~${quote.timeEstimate}s` : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">You receive</dt>
                    <dd className="num font-medium text-foreground">
                      {quote.amountOutFormatted
                        ? `${Number(quote.amountOutFormatted).toFixed(4)} ${asset.symbol}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Minimum out (1% slippage)</dt>
                    <dd className="num font-medium text-foreground">
                      {quote.minAmountOut
                        ? `${formatTokenAmount(Number(quote.minAmountOut) / 1e24, 4)} ${asset.symbol}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Value</dt>
                    <dd className="num font-medium text-foreground">
                      {quote.amountOutUsd ? formatUsd(Number(quote.amountOutUsd)) : "—"}
                    </dd>
                  </div>
                </dl>
                <Button className="w-full" size="lg" variant="secondary" onClick={confirmDeposit}>
                  Get deposit address
                </Button>
                <Button className="w-full" variant="ghost" size="sm" onClick={() => setState("config")}>
                  Back to edit
                </Button>
              </div>
            )}

            {state === "submitting" && (
              <div className="animate-fade-in flex flex-col items-center gap-2 py-4">
                <p className="text-[13px] font-medium text-foreground">
                  Requesting a deposit address from 1Click…
                </p>
              </div>
            )}

            {state === "funding" && depositAddress && (
              <div className="animate-fade-in space-y-3">
                <div className="rounded-lg border border-dashed border-border-strong bg-input p-3.5">
                  <p className="text-xs text-muted-foreground">
                    Send{" "}
                    <span className="num font-medium text-foreground">{formatUsd(parsedUsdc)}</span>{" "}
                    USDC on any supported chain to
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <code className="num break-all text-[13px] text-foreground">{depositAddress}</code>
                    <CopyButton value={depositAddress} />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    This address set came from the 1Click reusable-address API just now. Funds route
                    to <span className="num">{VAULT_CONFIG.vaultAccount}</span>; the reserve then
                    moves to <span className="num">{VAULT_CONFIG.escrowAccount}</span>. Refunds
                    return to the vault&apos;s intents balance.
                  </p>
                  {chainAddresses.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {chainAddresses.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5"
                        >
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {c.blockchain ?? "chain"}
                          </span>
                          <span className="num min-w-0 truncate text-[11px] text-foreground">
                            {c.depositAddress}
                          </span>
                          <CopyButton value={c.depositAddress ?? ""} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-input px-3.5 py-2.5 text-[13px]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    1Click status
                  </span>
                  <span className="num font-medium text-foreground">{status ?? "checking…"}</span>
                </div>
                {status && TERMINAL_STATUS_BADGE[status] && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {TERMINAL_STATUS_BADGE[status]}
                  </p>
                )}
                {status === "FAILED" || status === "REFUNDED" || status === "INCOMPLETE_DEPOSIT" ? (
                  <Button className="w-full" variant="secondary" onClick={retryStatus}>
                    Retry status
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" variant="secondary" disabled>
                    Waiting for your deposit…
                  </Button>
                )}
              </div>
            )}

            {state === "settled" && (
              <div className="animate-fade-in space-y-3">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-up-soft text-up">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-[13px] font-medium text-foreground">Deposit settled on 1Click</p>
                  <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                    The risk leg swapped into {asset.symbol}. Minting the position NFT runs through
                    the vault contract&apos;s deposit entry — that opens the moment the contract is
                    deployed at <span className="num">{VAULT_CONFIG.vaultAccount}</span>.
                  </p>
                </div>
                <Button className="w-full" size="lg" href="/positions">
                  Open positions
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuote(null);
                    setDepositAddress(null);
                    setStatus(null);
                    setState("config");
                  }}
                >
                  Create another
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explainer */}
      <section className="animate-fade-up delay-100 engraved rounded-2xl bg-card p-4">
        <p className="eyebrow mb-2.5">What happens to your deposit</p>
        <ol className="list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
          <li>
            The vault splits it: <span className="num text-foreground">{(floorBps / 100).toFixed(0)}%</span>{" "}
            reserve to the escrow contract, the rest becomes your risk budget.
          </li>
          <li>
            The keeper swaps the risk budget into {asset.symbol} through 1Click, inside your
            slippage bound — the quote above is the real one.
          </li>
          <li>You receive a NEP-171 NFT — the position. Sell it without unwinding it.</li>
        </ol>
      </section>
    </div>
  );
}

const TERMINAL_STATUS_BADGE: Record<string, string> = {
  PENDING_DEPOSIT: "1Click is watching this address — send the funds to proceed.",
  KNOWN_DEPOSIT_TX: "Deposit detected on the source chain.",
  PROCESSING: "Solvers are processing the swap.",
  SUCCESS: "Deposit settled — the risk leg is in.",
  FAILED: "1Click reported a failure — funds follow the refund path.",
  REFUNDED: "Funds were refunded to the vault's address.",
  INCOMPLETE_DEPOSIT: "Deposit incomplete — the amount did not cover the quote.",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="num text-[13px] text-foreground">{value}</span>
    </div>
  );
}
