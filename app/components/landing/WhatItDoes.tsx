import { Lock, ArrowRightLeft, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";

const steps = [
  {
    num: "01",
    icon: Lock,
    title: "Split at the contract",
    description:
      "The vault splits your deposit the moment it lands: the reserve — 90% by default — transfers to a separate escrow contract, and only the risk budget ever touches a market.",
    diagram: [
      { label: "Reserve", value: "$900.00", sub: "→ escrow contract" },
      { label: "Risk budget", value: "$100.00", sub: "→ verified route" },
    ],
    badge: "ReserveEscrowed event",
  },
  {
    num: "02",
    icon: TrendingDown,
    title: "De-risk once, by rule",
    description:
      "If the risk bucket falls 50% below what it cost, the keeper sells all of it — one shot, no discretion. The proceeds lock until maturity; the rule never re-enters.",
    diagram: [
      { label: "Risk bucket", value: "−52.0%", sub: "from cost basis" },
      { label: "Sold once", value: "$48.00", sub: "realised · locked" },
    ],
    badge: "DeRiskTriggered · DeRiskSettled",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "Maturity pays NAV",
    description:
      "Payout equals NAV: the reserve plus whatever the risk bucket kept. The position is an NEP-171 NFT — transfer it, and settle pays whoever holds it.",
    diagram: [
      { label: "Floor", value: "$900.00", sub: "never breached" },
      { label: "Payout", value: "$948.00", sub: "= NAV at settle" },
    ],
    badge: "NEP-171 · settle pays the holder",
  },
];

export function WhatItDoes() {
  return (
    <section id="what" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="eyebrow">What Floorline does</p>
          <h2 className="display mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
            One deposit in. One loss limit out.
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {steps.map((s, idx) => (
            <Reveal
              key={s.num}
              as="li"
              delay={idx * STAGGER.row}
              className="grid gap-6 py-10 md:grid-cols-[80px_1fr_340px] md:items-center md:gap-10"
            >
              <div>
                <s.icon className="h-4 w-4 text-faint md:hidden" aria-hidden />
                <span className="num text-sm text-faint">{s.num}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                <span className="num mt-3 inline-block rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                  {s.badge}
                </span>
              </div>
              {/* Mini diagram — the money path */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                {s.diagram.map((d, i) => (
                  <div key={d.label} className="flex min-w-0 flex-1 items-center gap-2">
                    {i > 0 && <ArrowRight className="h-3 w-3 shrink-0 text-faint" aria-hidden />}
                    <div className="min-w-0 flex-1 rounded-lg border border-border bg-input px-3 py-2.5">
                      <p className="eyebrow">{d.label}</p>
                      <p className="num mt-0.5 text-[13px] font-semibold text-foreground">{d.value}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{d.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={STAGGER.row}>
          <p className="mt-8 flex items-center gap-2 text-[13px] text-muted-foreground">
            <ArrowRightLeft className="h-3.5 w-3.5 text-faint" aria-hidden />
            Event names match the contract — the UI reads the same log the chain writes.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
