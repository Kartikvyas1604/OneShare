import { Lock, TrendingDown, Zap, Cuboid, BrainCircuit, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Escrowed reserve",
    description:
      "The reserve sits in a separate contract whose only door is the vault's settle path. A 20,000-sequence invariant suite fails if any other path can move it.",
  },
  {
    icon: TrendingDown,
    title: "Automated de-risk",
    description:
      "Sell the risk bucket at −50% from cost — once, with no keeper discretion. The effect is backtested over 10,000 simulated paths, seed 20261112.",
  },
  {
    icon: Zap,
    title: "Any-chain funding",
    description:
      "USDC from 30+ chains through NEAR Intents. Quotes run dry first, slippage is bounded in the contract, refunds route back to your wallet.",
  },
  {
    icon: Cuboid,
    title: "Transferable position",
    description:
      "The position is an NEP-171 NFT. Transfer it and the claim moves with it — whoever holds it settles, and settle pays the holder.",
  },
  {
    icon: BrainCircuit,
    title: "TEE attestation",
    description:
      "The de-risk decision runs in NEAR AI Cloud inside a TEE, and the attestation hash lands on the position. Until that flow verifies, a local rule runs and the badge says pending.",
  },
  {
    icon: ShieldCheck,
    title: "No leverage, no liquidation",
    description:
      "v1 borrows nothing, so nothing can be liquidated. The worst case is the risk budget you set — a number you chose before you deposited.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <p className="eyebrow animate-fade-up">Features</p>
        <h2 className="display animate-fade-up delay-75 mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
          A loss limit enforced by custody.
        </h2>
        <p className="animate-fade-up delay-150 mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Not a stop-loss on thin liquidity. Not a multiplier knob. Custody, automation, and a cap
          you set — with the tests to back each claim.
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
