import { Zap, KeyRound, Cuboid, Shield, BrainCircuit, RefreshCcw } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "NEAR Intents funding",
    description:
      "Fund from any token on any supported chain through 1Click solvers. The vault never holds your funds outside execution, and refunds go to you.",
  },
  {
    icon: KeyRound,
    title: "MPC custody, zero keys",
    description:
      "Your Solana address is derived from your NEAR account via Chain Signatures. No key transfer, no custodian, no single point of compromise.",
  },
  {
    icon: Cuboid,
    title: "Position = NFT",
    description:
      "The position is a NEP-171 NFT. Transfer it and control of the Solana account moves with it — sell it, gift it, or pledge it as collateral.",
  },
  {
    icon: Shield,
    title: "Policy-bounded keeper",
    description:
      "The keeper holds a FunctionCall key limited to three methods. It can only act inside your stop-loss, take-profit, and slippage bounds — with a 5 NEAR bond at stake.",
  },
  {
    icon: BrainCircuit,
    title: "TEE-attested explain",
    description:
      "Explanations run inside a TEE on NEAR AI Cloud and return a verifiable attestation quote. If the service is down, you get a clearly-marked cache.",
  },
  {
    icon: RefreshCcw,
    title: "Deterministic simulator",
    description:
      "Backtest on real 2025–26 NVDA daily closes. Fixed-point integers, golden vectors, byte-identical output across TypeScript and Rust.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <p className="eyebrow animate-fade-up">Features</p>
        <h2 className="animate-fade-up delay-75 mt-2 max-w-xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Rails a brokerage can’t ship.
        </h2>
        <p className="animate-fade-up delay-150 mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Three things a brokerage can’t do: fund from any chain without a bank, hold the asset
          with keys no one else has, and make the position itself portable.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className={`animate-fade-up delay-${(idx % 3) * 100 + 100} bg-card p-6 transition-colors duration-150 hover:bg-secondary`}
            >
              <f.icon className="h-4 w-4 text-faint" aria-hidden />
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
