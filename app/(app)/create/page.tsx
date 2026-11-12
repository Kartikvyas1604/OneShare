"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { ChainBadge } from "@/app/components/ChainBadge";
import { CopyButton } from "@/app/components/CopyButton";
import { Badge } from "@/app/components/Badge";
import { Slider } from "@/app/components/Slider";
import { Check, ChevronDown, CircleDot } from "lucide-react";
import {
  RISK_ASSETS,
  RISK_PRICE_USDC,
  VAULT_CONFIG,
  MOCK_EPOCH,
  splitDeposit,
  targetUnits,
  riskAsset,
  type FloorlinePosition,
} from "@/app/lib/floorline";
import { pushSessionPosition } from "@/app/lib/session-positions";
import { formatUsd, formatTokenAmount, sleep } from "@/app/lib/utils";

type CreateState = "config" | "quoting" | "quoted" | "submitting" | "done";

const TERMS = [
  { label: "7 days", seconds: 604_800 },
  { label: "30 days", seconds: 2_592_000 },
  { label: "90 days", seconds: 7_776_000 },
] as const;

const DEPOSIT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

export default function CreatePage() {
  const router = useRouter();
  const [state, setState] = useState<CreateState>("config");
  const [amount, setAmount] = useState("100");
  const [amountTouched, setAmountTouched] = useState(false);
  const [floorBps, setFloorBps] = useState<number>(VAULT_CONFIG.floorRatioBps);
  const [termSeconds, setTermSeconds] = useState<number>(VAULT_CONFIG.termSeconds);
  const [assetId, setAssetId] = useState<string>(VAULT_CONFIG.riskAssetId);
  const [minted, setMinted] = useState<FloorlinePosition | null>(null);

  const asset = riskAsset(assetId);
  const parsedUsdc = Number(amount) || 0;
  const depositMicro = Math.round(parsedUsdc * 1e6);
  const { floorAmount, riskBudget } = splitDeposit(depositMicro, floorBps);
  const units = targetUnits(riskBudget, RISK_PRICE_USDC);

  const amountError = useMemo(() => {
    if (!amountTouched) return undefined;
    if (parsedUsdc < VAULT_CONFIG.minDeposit / 1e6)
      return `Minimum deposit is ${VAULT_CONFIG.minDeposit / 1e6} USDC.`;
    if (depositMicro > VAULT_CONFIG.maxTvl) return "Above the vault's 100,000 USDC cap.";
    return undefined;
  }, [amountTouched, parsedUsdc, depositMicro]);

  const canReview = !amountError && parsedUsdc > 0;

  const review = async () => {
    setAmountTouched(true);
    if (!canReview) return;
    setState("quoting");
    await sleep(700); // mock 1Click dry quote
    setState("quoted");
  };

  const confirmDeposit = async () => {
    setState("submitting");
    await sleep(1_800); // mock deposit → escrow → buy settle
    const id = 100 + Math.floor(Math.random() * 100);
    const hex =
      "0x" +
      Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(
        ""
      );
    const position: FloorlinePosition = {
      id,
      hex_id: hex,
      owner: "priya.near",
      risk_asset_id: assetId,
      deposit_amount: depositMicro,
      floor_amount: floorAmount,
      risk_budget: riskBudget,
      risk_units: 0,
      cost_basis: 0,
      realised_quote: 0,
      de_risked: false,
      opened_at: MOCK_EPOCH,
      matures_at: MOCK_EPOCH + termSeconds * 1_000,
      state: "open",
    };
    pushSessionPosition(position);
    setMinted(position);
    setState("done");
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Create</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">New position</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Deposit USDC from any chain, pick a loss limit, and see the worst case in dollars before
          you send anything.
        </p>
      </header>

      {/* Progress */}
      {state !== "config" && (
        <ol className="flex items-center gap-2" aria-label="Progress">
          {(
            [
              { key: "quoted", label: "Split" },
              { key: "submitting", label: "Settle" },
              { key: "done", label: "Mint" },
            ] as const
          ).map((step, idx) => {
            const order = ["config", "quoting", "quoted", "submitting", "done"];
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
                    <Badge variant={a.verified ? "up" : "neutral"}>
                      {a.verified ? "Verified route" : "Route pending"}
                    </Badge>
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

          {/* Live readout */}
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
              label={`Est. ${asset.symbol} @ $${RISK_PRICE_USDC.toFixed(2)}`}
              value={riskBudget > 0 ? `${formatTokenAmount(units, 4)} ${asset.symbol}` : "—"}
            />
            <Row label="De-risk trigger" value="−50% from cost basis" />
            <Row label="Early exit fee" value={`${VAULT_CONFIG.earlyExitFeeBps / 100}%`} />
            <Row label="Fees" value="0% for the hackathon" />
          </div>

          {/* Actions */}
          <div className="p-4">
            {(state === "config" || state === "quoting") && (
              <Button
                className="w-full"
                size="lg"
                onClick={review}
                isLoading={state === "quoting"}
                disabled={!canReview}
              >
                {state === "quoting" ? "Fetching 1Click quote…" : "Review deposit"}
              </Button>
            )}

            {state === "quoted" && (
              <div className="animate-fade-in space-y-3">
                <div className="rounded-lg border border-dashed border-border-strong bg-input p-3.5">
                  <p className="text-xs text-muted-foreground">
                    Send{" "}
                    <span className="num font-medium text-foreground">{formatUsd(parsedUsdc)}</span>{" "}
                    USDC on Base to
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <code className="num text-[13px] text-foreground">{DEPOSIT_ADDRESS}</code>
                    <CopyButton value={DEPOSIT_ADDRESS} />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    1Click routes it to {VAULT_CONFIG.vaultAccount} on NEAR. The reserve moves to{" "}
                    <span className="num">{VAULT_CONFIG.escrowAccount}</span> at deposit; refunds
                    return to your wallet.
                  </p>
                </div>
                <Button className="w-full" size="lg" variant="secondary" onClick={confirmDeposit}>
                  I sent the funds
                </Button>
                <Button className="w-full" variant="ghost" size="sm" onClick={() => setState("config")}>
                  Back to edit
                </Button>
              </div>
            )}

            {state === "submitting" && (
              <div className="animate-fade-in flex flex-col items-center gap-2 py-4">
                <p className="text-[13px] font-medium text-foreground">
                  Escrowing the reserve, buying the risk budget…
                </p>
                <p className="text-xs text-muted-foreground">
                  Two transactions: escrow deposit, then the 1Click swap. About 20 seconds.
                </p>
              </div>
            )}

            {state === "done" && minted && (
              <div className="animate-fade-in space-y-3">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-up-soft text-up">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-[13px] font-medium text-foreground">Position minted</p>
                  <p className="num text-[11px] text-muted-foreground">
                    NEP-171 token #{minted.id} · {minted.hex_id.slice(0, 10)}… ·{" "}
                    {formatUsd(minted.deposit_amount / 1e6)} deposited
                  </p>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push(`/vault/${minted.hex_id}`)}
                >
                  View position
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMinted(null);
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
            slippage bound.
          </li>
          <li>You receive a NEP-171 NFT — the position. Sell it without unwinding it.</li>
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
