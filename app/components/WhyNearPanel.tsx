import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Zap, KeyRound, Cuboid, BrainCircuit } from "lucide-react";

const items = [
  {
    icon: Zap,
    title: "NEAR Intents",
    description: "Fund from any token on any chain without bridging UIs.",
  },
  {
    icon: KeyRound,
    title: "Chain Signatures",
    description: "Solana custody derived by MPC. We never hold a key.",
  },
  {
    icon: Cuboid,
    title: "Position NFT",
    description: "Your position is a portable, collateralizable object.",
  },
  {
    icon: BrainCircuit,
    title: "TEE explain",
    description: "Attested AI explains every action without leaking data.",
  },
];

export function WhyNearPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What NEAR enables</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <item.icon className="h-5 w-5 text-brand-400" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
