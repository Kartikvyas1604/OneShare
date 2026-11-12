"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { Badge } from "@/app/components/Badge";
import { ChainBadge } from "@/app/components/ChainBadge";
import { NVDA_TICKER, generateMockQuote, Quote } from "@/app/lib/data";
import { formatUsd, formatTokenAmount, formatBps, sleep, truncateAddress } from "@/app/lib/utils";
import {
  ArrowRightLeft,
  ChevronDown,
  Clock,
  Copy,
  Info,
  Wallet,
  CheckCircle2,
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

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h1 className="text-balance text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          Own $10 of NVIDIA in 60 seconds
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pay with any token, any chain. Receive a self-managing position NFT on NEAR.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-400" aria-hidden />
            Buy {ticker.symbol}
          </CardTitle>
          <CardDescription>{ticker.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground">Pay with</label>
            <button
              type="button"
              className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-input px-4 text-sm text-foreground transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2">
                <ChainBadge chain="Base" /> USDC
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          </div>

          <Input
            label="Amount (USDC)"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint="Minimum $1. You can fund from any chain."
          />

          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Receive</span>
              <span className="font-mono font-semibold text-foreground">
                {state === "quoted" || state === "funding" || state === "buying" || state === "done"
                  ? formatTokenAmount(estimatedShares)
                  : "—"}{" "}
                {ticker.symbol}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Price impact</span>
              <span className="font-mono">
                {quote ? formatBps(quote.price_impact_bps) : "—"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Fee</span>
              <span className="font-mono">{quote ? formatUsd(feeUsdc) : "—"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Net invested</span>
              <span className="font-mono">{quote ? formatUsd(netUsdc) : "—"}</span>
            </div>
          </div>

          {state === "idle" && (
            <Button className="w-full" onClick={getQuote}>
              Get quote
            </Button>
          )}
          {state === "quoting" && (
            <Button className="w-full" isLoading>
              Getting quote…
            </Button>
          )}
          {state === "quoted" && (
            <Button className="w-full" onClick={startFunding}>
              Continue to deposit
            </Button>
          )}
          {state === "funding" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                <p className="text-xs text-muted-foreground">Send {formatUsd(Number(amount))} USDC on Base to</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <code className="font-mono text-sm text-foreground">{truncateAddress(depositAddress, 10)}</code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(depositAddress)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Copy deposit address"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
              <Button className="w-full" variant="secondary" onClick={simulateDeposit}>
                I sent the funds
              </Button>
            </div>
          )}
          {state === "buying" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15">
                <Clock className="h-6 w-6 animate-pulse text-brand-400" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">Buying {ticker.symbol} on Solana…</p>
              <p className="text-xs text-muted-foreground">USDC arrived. Keeper is swapping via Jupiter.</p>
            </div>
          )}
          {state === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-6 w-6 text-success" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">Position NFT minted</p>
              <p className="text-xs text-muted-foreground">
                {formatTokenAmount(estimatedShares)} {ticker.symbol} is now in your NEAR wallet.
              </p>
              <Button className="w-full" variant="secondary" href="/positions">
                View position
              </Button>
            </div>
          )}
          {state === "error" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button className="mt-3 w-full" variant="secondary" onClick={getQuote}>
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">How it works</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>1Click routes your USDC from Base to a Solana address derived by NEAR Chain Signatures.</li>
              <li>The keeper swaps USDC → {ticker.symbol} via Jupiter.</li>
              <li>You receive a NEP-171 NFT on NEAR that controls the position.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
