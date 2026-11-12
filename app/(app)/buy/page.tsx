"use client";

import { useState } from "react";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { ChainBadge } from "@/app/components/ChainBadge";
import { CopyButton } from "@/app/components/CopyButton";
import { ErrorState } from "@/app/components/ErrorState";
import { NVDA_TICKER, generateMockQuote, Quote } from "@/app/lib/data";
import { formatUsd, formatTokenAmount, formatBps, sleep, truncateAddress } from "@/app/lib/utils";
import { ChevronDown, Check, CircleDot } from "lucide-react";

type BuyState = "idle" | "quoting" | "quoted" | "funding" | "buying" | "done" | "error";

const STEPS = [
  { key: "funding", label: "Fund" },
  { key: "buying", label: "Swap" },
  { key: "done", label: "Mint" },
] as const;

export default function BuyPage() {
  const [amount, setAmount] = useState("10");
  const [state, setState] = useState<BuyState>("idle");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depositAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

  const getQuote = async () => {
    setState("quoting");
    setError(null);
    try {
      await sleep(700);
      setQuote(generateMockQuote(Number(amount) || 0));
      setState("quoted");
    } catch {
      setError("Quote failed. Try again in a moment.");
      setState("error");
    }
  };

  const confirmDeposit = async () => {
    setState("buying");
    await sleep(2000);
    setState("done");
  };

  const ticker = NVDA_TICKER;
  const parsedAmount = Number(amount) || 0;
  const feeUsdc = quote ? (quote.amount_in * quote.fee_bps) / 1e6 / 10000 : 0;
  const netUsdc = quote ? quote.amount_in / 1e6 - feeUsdc : 0;
  const estimatedShares = quote ? quote.amount_out / 10 ** ticker.decimals : 0;
  const hasQuote = state !== "idle" && state !== "quoting" && state !== "error";
  const stepIndex = STEPS.findIndex((s) => s.key === state);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Buy</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">Buy {ticker.symbol}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          One tap, any chain.{" "}
          <span className="num">
            {formatUsd(ticker.price_usdc)} per {ticker.symbol}
          </span>{" "}
          · <span className="num text-up">+2.34%</span> today
        </p>
      </header>

      {/* Progress */}
      {hasQuote && (
        <ol className="flex items-center gap-2" aria-label="Progress">
          {STEPS.map((step, idx) => {
            const reached = stepIndex >= idx || state === "done";
            return (
              <li key={step.key} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium ${
                    reached ? "bg-up-soft text-up" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {stepIndex > idx || state === "done" ? (
                    <Check className="h-3 w-3" aria-hidden />
                  ) : (
                    <CircleDot className="h-3 w-3" aria-hidden />
                  )}
                  {step.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <span className={`h-px flex-1 ${reached ? "bg-up/40" : "bg-border"}`} aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Form card */}
      <section className="animate-fade-up rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {/* Pay */}
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
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          </div>

          {/* Amount */}
          <div className="p-4">
            <Input
              id="amount"
              label="Amount"
              type="number"
              inputMode="decimal"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint="Minimum $1 · funded from any chain"
            />
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {["10", "25", "50", "100"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`num h-8 rounded-lg border text-xs font-medium transition-colors duration-100 focus-visible:outline-none ${
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

          {/* Breakdown */}
          <div className="space-y-2.5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">You receive</span>
              <span className="num text-sm font-semibold text-foreground">
                {hasQuote ? `${formatTokenAmount(estimatedShares)} ${ticker.symbol}` : "—"}
              </span>
            </div>
            <Row
              label="Rate"
              value={
                hasQuote ? `${formatUsd(ticker.price_usdc)} / ${ticker.symbol}` : "—"
              }
            />
            <Row label="1Click fee" value={quote ? formatUsd(feeUsdc) : "—"} />
            <Row label="Price impact" value={quote ? formatBps(quote.price_impact_bps) : "—"} />
            <Row label="Net invested" value={quote ? formatUsd(netUsdc) : "—"} strong />
          </div>

          {/* Actions */}
          <div className="p-4">
            {state === "idle" && (
              <Button className="w-full" size="lg" onClick={getQuote} disabled={parsedAmount < 1}>
                Get quote
              </Button>
            )}
            {state === "quoting" && (
              <Button className="w-full" size="lg" isLoading>
                Getting quote…
              </Button>
            )}
            {state === "quoted" && (
              <div className="animate-fade-in space-y-2">
                <Button className="w-full" size="lg" onClick={() => setState("funding")}>
                  Continue
                </Button>
                <Button className="w-full" variant="ghost" size="sm" onClick={() => setState("idle")}>
                  Edit quote
                </Button>
              </div>
            )}
            {state === "funding" && (
              <div className="animate-fade-in space-y-3">
                <div className="rounded-lg border border-dashed border-border-strong bg-input p-3.5">
                  <p className="text-xs text-muted-foreground">
                    Send{" "}
                    <span className="num font-medium text-foreground">{formatUsd(parsedAmount)}</span>{" "}
                    USDC on Base to
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <code className="num text-[13px] text-foreground">
                      {truncateAddress(depositAddress, 10)}
                    </code>
                    <CopyButton value={depositAddress} />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    1Click solvers route it to your derived Solana address. Refunds always return
                    to your wallet.
                  </p>
                </div>
                <Button className="w-full" size="lg" variant="secondary" onClick={confirmDeposit}>
                  I sent the funds
                </Button>
              </div>
            )}
            {state === "buying" && (
              <div className="animate-fade-in flex flex-col items-center gap-2 py-4">
                <p className="text-[13px] font-medium text-foreground">
                  Swapping USDC → {ticker.symbol} on Solana
                </p>
                <p className="text-xs text-muted-foreground">
                  Keeper is executing inside your slippage bound. This takes about 20 seconds.
                </p>
              </div>
            )}
            {state === "done" && (
              <div className="animate-fade-in flex flex-col items-center gap-2 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-up-soft text-up">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-[13px] font-medium text-foreground">
                  {formatTokenAmount(estimatedShares)} {ticker.symbol} deposited · NFT minting
                </p>
                <Button className="mt-1 w-full" size="lg" href="/dashboard">
                  Open portfolio
                </Button>
              </div>
            )}
            {state === "error" && (
              <ErrorState
                title={error ?? "Quote failed"}
                description="Quotes expire after 60 seconds. Retrying fetches a fresh one."
                onRetry={getQuote}
              />
            )}
          </div>
        </div>
      </section>

      {/* Explainer */}
      <section className="animate-fade-up delay-100 rounded-xl border border-border bg-card p-4">
        <p className="eyebrow mb-2.5">How custody works</p>
        <ol className="list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
          <li>1Click routes your USDC from Base to a Solana address derived by NEAR Chain Signatures.</li>
          <li>The keeper swaps USDC → {ticker.symbol} via Jupiter inside your slippage bound.</li>
          <li>You receive a NEP-171 NFT on NEAR that controls the position.</li>
        </ol>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={`num text-[13px] ${strong ? "font-semibold text-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
