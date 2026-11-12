import { Zap, KeyRound, Cuboid, Shield, BrainCircuit, RefreshCcw } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "NEAR Intents funding",
    description:
      "Fund from any token on any supported chain through 1Click solvers. Refunds always route back to your address — the vault never holds your funds outside of execution.",
  },
  {
    icon: KeyRound,
    title: "MPC custody, zero keys",
    description:
      "Your Solana position address is derived from your NEAR account via Chain Signatures. No key transfer, no custodian, no single point of team compromise.",
  },
  {
    icon: Cuboid,
    title: "Position = NFT",
    description:
      "The position is a NEP-171 NFT. Transfer it and control of the underlying Solana account moves with it. Use it as portable, collateralizable object.",
  },
  {
    icon: Shield,
    title: "Policy-enforced keeper",
    description:
      "The keeper holds a FunctionCall key limited to three methods. It can only act inside your stop-loss, take-profit, and slippage bounds — with a 5 NEAR bond at stake.",
  },
  {
    icon: BrainCircuit,
    title: "TEE-attested explain",
    description:
      "Ask why your position sold or holds. Explanations run inside a TEE on NEAR AI Cloud and return a verifiable attestation quote — or a clearly-marked cache.",
  },
  {
    icon: RefreshCcw,
    title: "Deterministic simulator",
    description:
      "Backtest your policy on real 2025–26 NVDA daily closes. Fixed-point math, golden vectors, byte-identical output across TS and Rust.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">Features</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Rails a brokerage can’t ship
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Three things a brokerage can’t do: fund from any chain without a bank, hold the asset with
            keys no one else has, and make the position itself portable.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className={`animate-fade-up delay-${(idx % 3) * 100 + 100} group rounded-3xl border border-white/[0.07] bg-card p-6 transition-all duration-200 hover:border-brand-500/30 hover:shadow-glow-brand`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-950 text-brand-300 transition-colors group-hover:bg-brand-900">
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
