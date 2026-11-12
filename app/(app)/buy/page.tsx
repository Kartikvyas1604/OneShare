"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { ChainBadge } from "@/app/components/ChainBadge";
import { CopyButton } from "@/app/components/CopyButton";
import { NVDA_TICKER, generateMockQuote, Quote } from "@/app/lib/data";
import { formatUsd, formatTokenAmount, formatBps, sleep, truncateAddress } from "@/app/lib/utils";
import {
  ChevronDown,
  Clock,
  Info,
  Wallet,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Zap,
  Cuboid,
} from "lucide-react";

type BuyState = "idle" | "quoting" | "quoted" | "funding" | "buying" | "done" | "error";

export default function BuyPage() {
  const [amount, setAmount] = useState<string>("10");
  const [state, setState] = useState<BuyState>("idle");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depositAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

  const getQuote = async () => {
    setState("quoting");
    setError(null);
    try {
      await sleep(800);
      const q = generateMockQuote(Number(amount) || 0);
      setQuote(q);
      setState("quoted");
    } catch {
      setError("Quote failed. Try again in a moment.");
      setState("error");
    }
  };

  const startFunding = async () => {
    setState("funding");
  };

  const simulateDeposit = async () => {
    setState("buying");
    await sleep(2000);
    setState("done");
  };

  const ticker = NVDA_TICKER;
  const feeUsdc = quote ? (quote.amount_in * quote.fee_bps) / 1e6 / 10000 : 0;
  const netUsdc = quote ? quote.amount_in / 1e6 - feeUsdc : 0;
  const estimatedShares = quote ? quote.amount_out / 10 ** ticker.decimals : 0;
  const hasQuote = state === "quoted" || state === "funding" || state === "buying" || state === "done";

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-brand-500/15 bg-gradient-to-br from-brand-900/50 via-card to-background p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl animate-pulse-glow" aria-hidden />
        <h1 className="relative text-balance text-[26px] font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
          Own $10 of NVIDIA in 60 seconds
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          Pay with any token, any chain. Receive a self-managing position NFT on NEAR.
        </p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Zap className="h-3 w-3 text-brand-300" aria-hidden />
            NEAR Intents
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <KeyRound className="h-3 w-3 text-brand-300" aria-hidden />
            MPC custody
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Cuboid className="h-3 w-3 text-brand-300" aria-hidden />
            Position NFT
          </span>
        </div>
      </section>

      {/* Buy card */}
      <Card className="animate-fade-up delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-300" aria-hidden />
            Buy {ticker.symbol}
          </CardTitle>
          <CardDescription>{ticker.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground" htmlFor="pay-with">
              Pay with
            </label>
            <button
              id="pay-with"
              type="button"
              className="flex h-12 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-input px-4 text-sm text-foreground transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex items-center gap-2">
                <ChainBadge chain="Base" /> USDC
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          </div>

          {/* Amount with quick chips */}
          <div className="space-y-2">
            <Input
              id="amount"
              label="Amount (USDC)"
              type="number"
              inputMode="decimal"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint="Minimum $1. Fund from any chain."
            />
            <div className="flex gap-2">
              {["10", "25", "50", "100"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    amount === v
                      ? "border-brand-500/40 bg-brand-500/10 text-brand-200"
                      : "border-white/[0.07] bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Quote box */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">You receive</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {hasQuote ? formatTokenAmount(estimatedShares) : "—"} {ticker.symbol}
              </span>
            </div>
            <div className="my-2.5 h-px bg-white/[0.06]" aria-hidden />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Price impact</span>
              <span className="font-mono tabular-nums">{quote ? formatBps(quote.price_impact_bps) : "—"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Fee (1Click, unkeyed)</span>
              <span className="font-mono tabular-nums">{quote ? formatUsd(feeUsdc) : "—"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Net invested</span>
              <span className="font-mono tabular-nums text-foreground">
                {quote ? formatUsd(netUsdc) : "—"}
              </span>
            </div>
          </div>

          {/* Action area per state */}
          {state === "idle" && (
            <Button className="w-full" onClick={getQuote}>
              Get quote
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {state === "quoting" && (
            <Button className="w-full" isLoading>
              Getting quote…
            </Button>
          )}
          {state === "quoted" && (
            <div className="animate-fade-in space-y-2">
              <Button className="w-full" onClick={startFunding}>
                Continue to deposit
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button className="w-full" variant="ghost" size="sm" onClick={() => setState("idle")}>
                Edit quote
              </Button>
            </div>
          )}
          {state === "funding" && (
            <div className="animate-fade-in space-y-3">
              <div className="rounded-2xl border border-dashed border-brand-500/30 bg-brand-500/[0.05] p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Send {formatUsd(Number(amount))} USDC on Base to
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <code className="font-mono text-sm font-semibold text-foreground">
                    {truncateAddress(depositAddress, 10)}
                  </code>
                  <CopyButton value={depositAddress} label="Copy address" />
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  1Click solvers route it to your derived Solana address. Refunds always go back to
                  your wallet.
                </p>
              </div>
              <Button className="w-full" variant="secondary" onClick={simulateDeposit}>
                I sent the funds
              </Button>
            </div>
          )}
          {state === "buying" && (
            <div className="animate-fade-in flex flex-col items-center gap-3 py-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15">
                <Clock className="h-7 w-7 animate-pulse text-brand-300" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-foreground">Buying {ticker.symbol} on Solana…</p>
              <p className="text-center text-xs text-muted-foreground">
                USDC arrived at your derived address. The keeper is swapping via Jupiter and will
                mint your position NFT.
              </p>
              <div className="mt-1 flex w-full items-center gap-2" aria-hidden>
                <div className="h-1 flex-1 rounded-full bg-success" />
                <div className="h-1 flex-1 rounded-full bg-brand-400" />
                <div className="h-1 flex-1 rounded-full bg-white/10" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Funded · Swapping · Mint
              </p>
            </div>
          )}
          {state === "done" && (
            <div className="animate-fade-up flex flex-col items-center gap-3 py-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-foreground">Position NFT minted</p>
              <p className="text-center text-xs text-muted-foreground">
                {formatTokenAmount(estimatedShares)} {ticker.symbol} lives in your NEAR wallet as a
                position NFT. Policy is armed.
              </p>
              <Button className="w-full" variant="secondary" href="/dashboard">
                Open dashboard
              </Button>
            </div>
          )}
          {state === "error" && (
            <div className="animate-fade-in rounded-2xl border border-destructive/25 bg-destructive/[0.07] p-4">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Quotes expire after 60 seconds. Retrying fetches a fresh one.
              </p>
              <Button className="mt-3 w-full" variant="secondary" onClick={getQuote}>
                Retry quote
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="animate-fade-up delay-200 rounded-2xl border border-white/[0.07] bg-card p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">How it works</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>1Click routes your USDC from Base to a Solana address derived by NEAR Chain Signatures.</li>
              <li>The keeper swaps USDC → {ticker.symbol} via Jupiter inside your slippage bound.</li>
              <li>You receive a NEP-171 NFT on NEAR that controls the position.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
