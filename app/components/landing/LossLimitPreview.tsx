"use client";

import { useState } from "react";
import { Button } from "@/app/components/Button";
import { Slider } from "@/app/components/Slider";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";
import { VAULT_CONFIG, splitDeposit, targetUnits } from "@/app/lib/floorline";
import { useLivePrices } from "@/app/lib/prices";
import { formatUsd, formatTokenAmount } from "@/app/lib/utils";

const DEMO_DEPOSIT_MIN = 10;
const DEMO_DEPOSIT_MAX = 10_000;

const PRESETS = [
  { amount: 100, label: "$100 · Starter" },
  { amount: 1_000, label: "$1,000 · Standard" },
  { amount: 10_000, label: "$10,000 · Desk" },
] as const;

/** Interactive loss-limit calculator — the hero preview. */
export function LossLimitPreview() {
  const [deposit, setDeposit] = useState(1_000);
  const [floorBps, setFloorBps] = useState<number>(VAULT_CONFIG.floorRatioBps);
  const { prices } = useLivePrices();
  const { floorAmount, riskBudget } = splitDeposit(deposit * 1e6, floorBps);
  const livePrice = prices.get("nep141:wrap.near")?.price;
  const units = livePrice !== undefined ? targetUnits(riskBudget, livePrice) : null;

  return (
    <section id="limits" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div>
            <p className="eyebrow">The loss limit</p>
            <h2 className="display mt-2 max-w-md text-4xl text-foreground md:text-5xl">
              Discipline is a bad strategy.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              &ldquo;Just hold 10% back&rdquo; fails at 3am in a red market. Floorline splits your
              deposit at the contract level: the reserve moves to a separate escrow the moment you
              deposit, before any trade exists. You are buying custody, not a promise.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-foreground">
              <li className="flex items-start gap-2.5">
                <span className="num mt-0.5 text-xs text-faint">01</span>
                The reserve is escrowed before the first buy settles.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="num mt-0.5 text-xs text-faint">02</span>
                The risk budget is the only bucket the market can touch.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="num mt-0.5 text-xs text-faint">03</span>
                The worst case is printed in dollars before you send anything.
              </li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={STAGGER.row} className="mx-auto w-full max-w-md">
          <div className="engraved rounded-2xl bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="eyebrow">Loss-limit calculator</span>
              <span className="num text-[11px] text-muted-foreground">
                {formatUsd(deposit)} deposit
              </span>
            </div>
            <div className="space-y-5 px-4 py-5">
              {/* Deposit */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="preview-deposit" className="eyebrow">
                    Deposit (USDC)
                  </label>
                  <span className="num text-[13px] font-medium text-foreground">
                    {formatUsd(deposit)}
                  </span>
                </div>
                <Slider
                  value={[deposit]}
                  min={DEMO_DEPOSIT_MIN}
                  max={DEMO_DEPOSIT_MAX}
                  step={10}
                  id="preview-deposit"
                  ariaLabel="Deposit size in USDC"
                  onValueChange={(v) => setDeposit(v[0])}
                />
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.amount}
                      type="button"
                      aria-pressed={deposit === p.amount}
                      onClick={() => setDeposit(p.amount)}
                      className={`num h-8 rounded-lg border text-[11px] font-medium transition-colors duration-100 focus-visible:outline-none ${
                        deposit === p.amount
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loss limit */}
              <div className="space-y-2.5 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="preview-loss-limit" className="eyebrow">
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
                  id="preview-loss-limit"
                  ariaLabel="Loss limit — share of the deposit held as reserve"
                  onValueChange={(v) => setFloorBps(v[0])}
                />
              </div>

              {/* Outputs */}
              <dl className="space-y-2 border-t border-border pt-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Reserve escrowed</dt>
                  <dd className="num font-medium text-foreground">{formatUsd(floorAmount / 1e6)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Risk budget</dt>
                  <dd className="num font-medium text-foreground">{formatUsd(riskBudget / 1e6)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    Est. wNEAR {livePrice !== undefined ? `@ $${livePrice.toFixed(4)} live` : ""}
                  </dt>
                  <dd className="num font-medium text-foreground">
                    {units !== null && riskBudget > 0 ? formatTokenAmount(units, 3) : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-border pt-3">
                  <dt className="eyebrow">Worst case</dt>
                  <dd className="num text-xl font-semibold text-foreground">
                    {formatUsd(floorAmount / 1e6)}
                  </dd>
                </div>
                <p className="text-right text-[11px] text-muted-foreground">
                  max loss {(100 - floorBps / 100).toFixed(0)}% · set by you, not the market
                </p>
              </dl>
              <Button className="w-full" href="/create">
                Set your loss limit
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
