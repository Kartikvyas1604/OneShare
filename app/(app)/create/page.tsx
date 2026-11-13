"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { Slider } from "@/app/components/Slider";
import { ErrorState } from "@/app/components/ErrorState";
import { TokenPicker, type LiveToken } from "@/app/components/TokenPicker";
import { Check, CircleDot } from "lucide-react";
import { VAULT_CONFIG } from "@/app/lib/floorline";
import { useWallet } from "@/app/components/wallet/WalletProvider";
import { VAULT_CONTRACT_ID } from "@/app/lib/vault";
import { formatUsd, formatTokenAmount, sleep } from "@/app/lib/utils";

type CreateState = "config" | "wrapping" | "depositing" | "settling" | "done";

const TERMS = [
  { label: "7 days", seconds: 604_800 },
  { label: "30 days", seconds: 2_592_000 },
  { label: "90 days", seconds: 7_776_000 },
] as const;

/** The quote asset the on-chain vault accepts (testnet: wNEAR). */
const QUOTE_ASSET = "wrap.testnet";
const WNEAR_ID = "nep141:wrap.near";
const STORAGE_DEPOSIT = BigInt("1250000000000000000000"); // 0.00125 NEAR

export default function CreatePage() {
  const router = useRouter();
  const { accountId, showConnect, signCall } = useWallet();
  const [amount, setAmount] = useState("100");
  const [amountTouched, setAmountTouched] = useState(false);
  const [floorBps, setFloorBps] = useState<number>(VAULT_CONFIG.floorRatioBps);
  const [termSeconds, setTermSeconds] = useState<number>(VAULT_CONFIG.termSeconds);
  const [state, setState] = useState<CreateState>("config");
  const [error, setError] = useState<string | null>(null);
  const [stepNote, setStepNote] = useState<string | null>(null);
  const [mintedId, setMintedId] = useState<number | null>(null);

  const [tokens, setTokens] = useState<LiveToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [payToken, setPayToken] = useState<LiveToken | null>(null);
  const [riskToken, setRiskToken] = useState<LiveToken | null>(null);

  // Live NVDA quote for the equity wedge (real feed, not mocked).
  const [nvdaQuote, setNvdaQuote] = useState<{
    price: number;
    changePct: number | null;
    source: string;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/equity-price");
        if (!res.ok) return;
        const q = (await res.json()) as {
          price: number;
          changePct: number | null;
          source: string;
        };
        if (!cancelled && Number.isFinite(q.price)) setNvdaQuote(q);
      } catch {
        /* the wedge strip is decorative — absence is fine */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live token list — the pay-with picker's data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tokens");
        const body = (await res.json()) as { tokens?: LiveToken[] };
        if (!cancelled && body.tokens) {
          setTokens(body.tokens);
          const wnear = body.tokens.find((t) => t.assetId === WNEAR_ID);
          if (wnear) setPayToken((prev) => prev ?? wnear);
          // Risk leg: BTC by default (the largest non-quote asset live on 1Click).
          const btc = body.tokens.find(
            (t) => t.symbol.toUpperCase() === "BTC" && t.blockchain === "near"
          );
          if (btc) setRiskToken((prev) => prev ?? btc);
        }
      } catch { /* the picker stays empty; the deposit still works on-chain */ }
      finally { if (!cancelled) setTokensLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const parsedAmount = Number(amount) || 0;
  // For the on-chain path the deposit is in wNEAR (24 decimals).
  const depositYocto = useMemo(() => {
    const n = Number(amount) || 0;
    if (!Number.isFinite(n) || n <= 0) return BigInt(0);
    return BigInt(Math.round(n * 10 ** 12) * 10 ** 12);
  }, [amount]);

  const floorDisplay = useMemo(() => {
    const floorYocto = (depositYocto * BigInt(floorBps)) / BigInt(10_000);
    return (Number(floorYocto) / 10 ** 24).toFixed(4);
  }, [depositYocto, floorBps]);

  const amountError = (() => {
    if (!amountTouched) return undefined;
    if (parsedAmount < 1) return "Minimum deposit is 1 wNEAR on testnet.";
    return undefined;
  })();

  const canDeposit = !amountError && parsedAmount > 0 && Boolean(accountId);

  // ── On-chain deposit flow ──

  const depositOnChain = async () => {
    setError(null);
    setStepNote(null);
    if (!accountId) { showConnect(); return; }
    try {
      setState("wrapping");
      // 1. Register the user on wrap.testnet (idempotent storage deposit).
      setStepNote("Registering on the token contract…");
      await signCall(QUOTE_ASSET, "storage_deposit", { account_id: accountId }, 10, STORAGE_DEPOSIT);

      // 2. Wrap NEAR → wNEAR (near_deposit attaches the NEAR).
      setStepNote(`Wrapping ${amount} NEAR…`);
      await signCall(QUOTE_ASSET, "near_deposit", {}, 10, depositYocto);

      // 3. ft_transfer_call to the vault — msg "deposit" splits + escrows + mints.
      setState("depositing");
      setStepNote("Depositing into the vault…");
      await signCall(QUOTE_ASSET, "ft_transfer_call", {
        receiver_id: VAULT_CONTRACT_ID,
        amount: depositYocto.toString(),
        msg: "deposit",
      }, 150, depositYocto);

      // The contract emits Deposited + mints the NFT. Fetch the newest id.
      setStepNote("Reading your position…");
      await sleep(1_500);
      const res = await fetch(`/api/vault/positions?account=${encodeURIComponent(accountId)}`);
      const body = (await res.json()) as { positions?: Array<{ id: number }> };
      const ids = body.positions ?? [];
      setMintedId(ids.length > 0 ? ids[ids.length - 1].id : null);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      setState("config");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Create</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">New position</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Deposit on-chain with your wallet — the contract splits it and mints the position NFT.
        </p>
      </header>

      {/* Progress */}
      {state !== "config" && (
        <ol className="flex items-center gap-2" aria-label="Progress">
          {(
            [
              { key: "wrapping", label: "Wrap" },
              { key: "depositing", label: "Deposit" },
              { key: "done", label: "Mint" },
            ] as const
          ).map((step, idx) => {
            const order = ["config", "wrapping", "depositing", "done"];
            const reached = order.indexOf(state) >= order.indexOf(step.key) || state === "settling";
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
          {/* Pay with — live token picker */}
          <div className="space-y-2 p-4">
            <span className="eyebrow">Pay with</span>
            <TokenPicker
              tokens={tokens}
              selectedAssetId={payToken?.assetId ?? ""}
              onSelect={setPayToken}
              loading={tokensLoading}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Live 1Click token list — {tokens.length} assets across chains. On testnet the vault
              accepts <span className="num text-foreground">wNEAR</span> as the funding asset.
            </p>
          </div>

          {/* Risk asset — live picker over every 1Click asset */}
          <fieldset className="space-y-2 p-4">
            <legend className="eyebrow">Risk asset — what the risk budget buys</legend>
            <TokenPicker
              tokens={tokens}
              selectedAssetId={riskToken?.assetId ?? ""}
              onSelect={setRiskToken}
              loading={tokensLoading}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Any of the 231 live assets — BTC, ETH, SOL, gold-backed tokens. The keeper swaps the
              risk budget into your pick through 1Click. Tokenized equities (NVDAon…) list here
              automatically the moment they appear on 1Click — the gate is live-checked, never hardcoded.
            </p>
            {nvdaQuote && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="num font-medium text-foreground">
                  NVDA ${nvdaQuote.price.toFixed(2)}
                  {nvdaQuote.changePct !== null && (
                    <span className={nvdaQuote.changePct < 0 ? " text-red-600" : " text-emerald-600"}>
                      {" "}
                      ({nvdaQuote.changePct > 0 ? "+" : ""}
                      {nvdaQuote.changePct.toFixed(2)}%)
                    </span>
                  )}
                </span>{" "}
                live from {nvdaQuote.source} — the equity feed the keeper quotes from. On testnet the
                NVDA leg already runs end-to-end against the stand-in token
                ({`nvda.floorline-escrow.testnet`}); see docs/ONCHAIN-TRAIL.md.
              </p>
            )}
          </fieldset>

          {/* Amount */}
          <div className="p-4">
            <Input
              id="amount"
              label="Deposit (wNEAR)"
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
              hint="Minimum 1 wNEAR on testnet · wrapped from NEAR automatically"
            />
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {["1", "5", "10", "25"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setAmount(v); setAmountTouched(true); }}
                  className={`num h-10 rounded-lg border text-xs font-medium transition-colors duration-100 focus-visible:outline-none ${
                    amount === v
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {v} Ⓝ
                </button>
              ))}
            </div>
          </div>

          {/* Loss limit */}
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="loss-limit" className="eyebrow">Loss limit</label>
              <span className="num text-[13px] font-medium text-foreground">{(floorBps / 100).toFixed(0)}% kept</span>
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
              <span className="num text-foreground">{(floorBps / 100).toFixed(0)}%</span> — max loss{" "}
              <span className="num text-foreground">{(100 - floorBps / 100).toFixed(0)}%</span> of the deposit.
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

          {/* Live readout */}
          <div className="space-y-2.5 p-4">
            <div className="rounded-lg border border-border bg-input p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Worst case</span>
                <span className="num text-xl font-semibold text-foreground">{floorDisplay} Ⓦ</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Escrowed before the first buy — a number you set, not one the market sets.
              </p>
            </div>
            <Row label="Reserve (escrowed)" value={`${floorDisplay} Ⓦ`} />
            <Row label="Risk budget" value={`${((100 - floorBps / 100) / 100 * Number(amount)).toFixed(4)} Ⓦ`} />
            <Row
              label={`Est. ${riskToken?.symbol ?? "risk"} @ live`}
              value={
                riskToken
                  ? `${formatTokenAmount(
                      (Number(amount) * ((100 - floorBps / 100) / 100)) / riskToken.price,
                      4
                    )} ${riskToken.symbol}`
                  : "—"
              }
            />
            <Row label="De-risk trigger" value="−50% from cost basis" />
            <Row label="Early exit fee" value={`${VAULT_CONFIG.earlyExitFeeBps / 100}%`} />
            <Row label="Fees" value="0% for the hackathon" />
          </div>

          {/* Actions — the real on-chain deposit */}
          <div className="p-4">
            {state === "config" && error && <ErrorState title="Deposit failed" description={error} className="mb-3" />}
            {(state === "config" || state === "wrapping" || state === "depositing") && (
              <>
                {!accountId && (
                  <p className="mb-3 rounded-lg border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-foreground">
                    Connect a NEAR wallet (Meteor, MyNearWallet…) to deposit on-chain — the
                    transaction splits your deposit and mints the position NFT.
                  </p>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={accountId ? depositOnChain : showConnect}
                  isLoading={state === "wrapping" || state === "depositing"}
                  disabled={(!canDeposit && Boolean(accountId)) || state !== "config"}
                >
                  {state === "wrapping" ? "Wrapping & depositing…" : state === "depositing" ? "Depositing into the vault…" : accountId ? "Deposit on-chain" : "Connect wallet to deposit"}
                </Button>
                {stepNote && state !== "config" && (
                  <p className="num mt-2 text-center text-[11px] text-muted-foreground">{stepNote}</p>
                )}
              </>
            )}

            {state === "done" && (
              <div className="animate-fade-in space-y-3">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-up-soft text-up">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-[13px] font-medium text-foreground">Position minted on-chain</p>
                  <p className="num text-[11px] text-muted-foreground">
                    NEP-171 token #{mintedId ?? "—"} · {formatUsd(Number(amount))} deposited
                  </p>
                </div>
                <Button className="w-full" size="lg" onClick={() => router.push("/positions")}>
                  View positions
                </Button>
                <Button className="w-full" variant="ghost" size="sm" onClick={() => { setMintedId(null); setState("config"); }}>
                  Create another
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explainer */}
      <section className="animate-fade-up delay-100 engraved rounded-2xl bg-card p-4">
        <p className="eyebrow mb-2.5">What happens on-chain</p>
        <ol className="list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
          <li>
            Your NEAR is wrapped to wNEAR, then{" "}
            <span className="num text-foreground">ft_transfer_call</span>&apos;d to{" "}
            <span className="num text-foreground">{VAULT_CONTRACT_ID}</span> with msg &quot;deposit&quot;.
          </li>
          <li>
            The contract splits it:{" "}
            <span className="num text-foreground">{(floorBps / 100).toFixed(0)}%</span> reserve to the
            escrow contract, the rest becomes your risk budget.
          </li>
          <li>A NEP-171 position NFT is minted — sell it without unwinding it.</li>
        </ol>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="num text-[13px] text-foreground">{value}</span>
    </div>
  );
}
