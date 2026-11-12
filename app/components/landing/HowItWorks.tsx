import { Coins, ArrowRightLeft, Cuboid } from "lucide-react";

const steps = [
  {
    icon: Coins,
    num: "01",
    title: "Fund from any chain",
    description:
      "Send USDC on Base — or any token a NEAR Intent supports. No bridging UI, no CEX hop, no waiting room. Refunds always route back to you.",
  },
  {
    icon: ArrowRightLeft,
    num: "02",
    title: "Solvers settle on Solana",
    description:
      "1Click delivers USDC to a Solana address derived from your NEAR account by the MPC network. We never hold a key — there is no key to hold.",
  },
  {
    icon: Cuboid,
    num: "03",
    title: "Receive a position NFT",
    description:
      "The position mints as a NEP-171 NFT on NEAR, carrying your stop-loss, take-profit, and DCA policy — enforced by the vault contract, not a promise.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <p className="eyebrow animate-fade-up">How it works</p>
        <h2 className="display animate-fade-up delay-75 mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
          Three steps. No brokerage account.
        </h2>

        <ol className="mt-12 divide-y divide-border border-y border-border">
          {steps.map((s, idx) => (
            <li
              key={s.num}
              className={`animate-fade-up delay-${(idx + 1) * 100} grid gap-4 py-8 md:grid-cols-[80px_240px_1fr] md:items-baseline md:gap-8`}
            >
              <span className="num text-sm text-faint">{s.num}</span>
              <div className="flex items-center gap-3 md:block">
                <s.icon className="h-4 w-4 shrink-0 text-faint md:hidden" aria-hidden />
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
              </div>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
