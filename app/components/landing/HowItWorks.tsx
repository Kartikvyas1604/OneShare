"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, BadgeCheck } from "lucide-react";
import { Reveal } from "@/app/components/motion/Reveal";

const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1];

const STEPS = [
  {
    num: "01",
    label: "Deposit",
    title: "USDC lands from any of 30+ chains",
    description:
      "One deposit address. The quote, the split, and the worst case are shown in dollars before you send anything.",
    outcome: "No bridging UI, no CEX hop — refunds route back to your wallet.",
    nodes: [
      { label: "Source", value: "Base · USDC", sub: "$1,000.00" },
      { label: "Route", value: "1Click deposit address", sub: "INTENTS rail" },
      { label: "Vault", value: "floorline-demo.near", sub: "position #1 mints" },
    ],
  },
  {
    num: "02",
    label: "Split",
    title: "The contract splits it before any trade exists",
    description:
      "The reserve — 90% by default — transfers to a separate escrow contract. Only the vault's settle path can ever release it.",
    outcome: "The reserve is escrowed before the first buy settles. A 3am panic sell cannot reach it.",
    nodes: [
      { label: "Deposit", value: "$1,000.00", sub: "floor ratio 90%" },
      { label: "Reserve", value: "$900.00", sub: "→ escrow contract · locked" },
      { label: "Risk budget", value: "$100.00", sub: "the only bucket exposed" },
    ],
  },
  {
    num: "03",
    label: "Buy & arm",
    title: "The risk budget buys in, the rule arms",
    description:
      "The keeper swaps the risk budget through the verified route inside your slippage bound, then arms the de-risk rule at −50% from cost.",
    outcome: "The rule executes with no discretion; the TEE attests the decision when verified.",
    nodes: [
      { label: "Buy", value: "27.932 wNEAR", sub: "$100.00 @ $3.58 · slippage bounded" },
      { label: "Rule", value: "−50% from cost", sub: "single-shot (I6) · armed" },
      { label: "Attestation", value: "TEE · pending", sub: "local rule meanwhile" },
    ],
  },
  {
    num: "04",
    label: "De-risk & settle",
    title: "Crash or rally, the floor holds",
    description:
      "A −52% drawdown sells the whole bucket once and locks the proceeds. At maturity, payout equals NAV and the NFT burns.",
    outcome: "Worst case was the number set at deposit — $900.00, never breached.",
    nodes: [
      { label: "Drawdown", value: "−52.0%", sub: "trigger crossed" },
      { label: "Sold once", value: "$48.00", sub: "realised · locked to maturity" },
      { label: "Payout", value: "$948.00", sub: "= NAV · NFT burned" },
    ],
  },
];

export function HowItWorks() {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const current = STEPS[step];

  return (
    <section id="how" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
            A $1,000 position, four steps.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Step list */}
          <Reveal>
            <div>
              <div role="group" aria-label="Steps" className="flex gap-2 lg:flex-col">
                {STEPS.map((s, i) => {
                  const active = i === step;
                  const reached = i <= step;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStep(i)}
                      className={`flex flex-1 items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex-none ${
                        active
                          ? "border-border-strong bg-secondary"
                          : "border-border bg-transparent hover:border-border-strong"
                      }`}
                    >
                      <span
                        className={`num text-xs font-semibold ${
                          active ? "text-foreground" : reached ? "text-muted-foreground" : "text-faint"
                        }`}
                      >
                        {s.num}
                      </span>
                      <span className={`text-[13px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  disabled={step === STEPS.length - 1}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  Next step
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              {/* Progress */}
              <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-up transition-[width] duration-200 ease-out"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </Reveal>

          {/* Stage */}
          <Reveal delay={0.12}>
            <div
              className="min-h-[380px] rounded-xl border border-border bg-card"
              aria-live="polite"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="p-4 md:p-6"
                >
                  <p className="eyebrow">{current.label}</p>
                  <h3 className="display mt-2 text-2xl text-foreground md:text-3xl">
                    {current.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                    {current.description}
                  </p>

                  {/* Node flow */}
                  <div className="mt-5 space-y-0">
                    {current.nodes.map((n, i) => (
                      <div key={n.label}>
                        {i > 0 && (
                          <div className="flex justify-center py-1">
                            <ArrowDown className="h-3.5 w-3.5 text-faint" aria-hidden />
                          </div>
                        )}
                        <div className="rounded-lg border border-border bg-input px-4 py-3">
                          <p className="eyebrow">{n.label}</p>
                          <p className="num mt-0.5 text-sm font-semibold text-foreground">{n.value}</p>
                          {n.sub && <p className="num mt-0.5 text-[10px] text-muted-foreground">{n.sub}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[13px] leading-relaxed text-foreground">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-up" aria-hidden />
                    <span>
                      <span className="font-medium">Outcome.</span> {current.outcome}
                    </span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
