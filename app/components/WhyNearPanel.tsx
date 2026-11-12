import { Zap, KeyRound, Cuboid, BrainCircuit } from "lucide-react";

const items = [
  {
    icon: Zap,
    title: "NEAR Intents",
    description: "Funded from any token on any chain — no bridging UI.",
  },
  {
    icon: KeyRound,
    title: "Chain Signatures",
    description: "Custody derived via MPC. No one holds your key.",
  },
  {
    icon: Cuboid,
    title: "Position NFT",
    description: "A portable object you can move or pledge.",
  },
  {
    icon: BrainCircuit,
    title: "TEE explain",
    description: "Attested AI breakdown of every action.",
  },
];

export function WhyNearPanel() {
  return (
    <section>
      <div className="mb-3 px-0.5">
        <h3 className="eyebrow">What NEAR enables</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-4">
            <item.icon className="h-4 w-4 text-faint" aria-hidden />
            <p className="mt-2.5 text-[13px] font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
