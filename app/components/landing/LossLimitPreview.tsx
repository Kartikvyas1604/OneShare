"use client";

import { useState } from "react";
import { Button } from "@/app/components/Button";
import { Slider } from "@/app/components/Slider";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";
import { VAULT_CONFIG, splitDeposit } from "@/app/lib/floorline";
import { formatUsd } from "@/app/lib/utils";

const DEMO_DEPOSIT = 1_000;

/** Interactive loss-limit preview — the spec's "/" screen carries one (§6.5). */
export function LossLimitPreview() {
  const [floorBps, setFloorBps] = useState<number>(VAULT_CONFIG.floorRatioBps);
  const { floorAmount, riskBudget } = splitDeposit(DEMO_DEPOSIT * 1e6, floorBps);

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

        <Reveal delay={STAGGER.row} className="mx-auto w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="eyebrow">Live preview</span>
              <span className="num text-[11px] text-muted-foreground">
                ${DEMO_DEPOSIT.toLocaleString("en-US")} deposit
              </span>
            </div>
            <div className="space-y-4 px-4 py-5">
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
              <dl className="space-y-2 border-t border-border pt-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Reserve escrowed</dt>
                  <dd className="num font-medium text-foreground">{formatUsd(floorAmount / 1e6)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Risk budget</dt>
                  <dd className="num font-medium text-foreground">{formatUsd(riskBudget / 1e6)}</dd>
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
