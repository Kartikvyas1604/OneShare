import { Badge } from "@/app/components/Badge";

/** On-chain position states — the contract enum, lowercased. */
const labels: Record<string, string> = {
  open: "Open",
  active: "Active",
  derisked: "De-risked",
  matured: "Matured",
  settled: "Settled",
  degraded: "Degraded",
};

const variants: Record<string, "default" | "up" | "down" | "warn" | "neutral"> = {
  open: "neutral",
  active: "up",
  derisked: "warn",
  matured: "default",
  settled: "neutral",
  degraded: "down",
};

export function StateBadge({ state }: { state: string }) {
  const label = labels[state] ?? state;
  const variant = variants[state] ?? "neutral";
  return (
    <Badge variant={variant}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </Badge>
  );
}
