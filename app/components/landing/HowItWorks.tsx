import { Coins, Landmark, TrendingDown, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";

const steps = [
  {
    icon: Coins,
    num: "01",
    title: "Deposit from any chain",
    description:
      "USDC from any of 30+ chains through NEAR Intents. The quote, the split, and the worst case are all in dollars before you send a sat.",
  },
  {
    icon: Landmark,
    num: "02",
    title: "The contract splits it",
    description:
      "floorline-demo.near moves the reserve — 90% by default — to a separate escrow contract. Only the vault's settle path can ever release it.",
  },
  {
    icon: TrendingDown,
    num: "03",
    title: "Buy, then de-risk on the rule",
    description:
      "The keeper swaps the risk budget through the verified route. If the bucket falls 50% below what it cost, it sells — once, automated, no discretion.",
  },
  {
    icon: CheckCircle2,
    num: "04",
    title: "Mature, settle, or transfer",
    description:
      "Payout at maturity equals NAV: the reserve plus whatever the risk bucket kept. Settle it, exit early for a 1% fee, or transfer the NFT — the claim moves with it.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <p className="eyebrow animate-fade-up">How it works</p>
        <h2 className="display animate-fade-up delay-75 mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
          One deposit. The contract does the rest.
        </h2>

        <ol className="mt-12 divide-y divide-border border-y border-border">
          {steps.map((s, idx) => (
            <Reveal
              key={s.num}
              as="li"
              delay={idx * STAGGER.row}
              className="grid gap-4 py-8 md:grid-cols-[80px_240px_1fr] md:items-baseline md:gap-8"
            >
              <span className="num text-sm text-faint">{s.num}</span>
              <div className="flex items-center gap-3 md:block">
                <s.icon className="h-4 w-4 shrink-0 text-faint md:hidden" aria-hidden />
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
              </div>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
