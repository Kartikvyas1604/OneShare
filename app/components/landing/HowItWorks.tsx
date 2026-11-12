import { Coins, ArrowRightLeft, Cuboid } from "lucide-react";

const steps = [
  {
    icon: Coins,
    step: "01",
    title: "Pay from any chain",
    description:
      "Send USDC on Base, or any token any NEAR Intent supports. No bridging UIs, no CEX hop, no waiting rooms.",
  },
  {
    icon: ArrowRightLeft,
    step: "02",
    title: "Solvers settle on Solana",
    description:
      "1Click routes your deposit to a Solana address derived from your NEAR account by the MPC network. We never hold a key.",
  },
  {
    icon: Cuboid,
    step: "03",
    title: "Get a position NFT",
    description:
      "The position mints as a NEP-171 NFT on NEAR, carrying your stop-loss, take-profit, and DCA policy enforced onchain.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            From any token to a real stock, in one tap
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Three steps. No brokerage account, no KYC queue, no manual bridge hops.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className={`animate-fade-up delay-${(idx + 1) * 100} group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-card p-6 transition-all duration-200 hover:border-brand-500/30 hover:shadow-glow-brand`}
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl transition-opacity duration-200 group-hover:opacity-100"
                aria-hidden
              />
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-950 text-brand-300">
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground/60">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
