import { Badge } from "@/app/components/Badge";
import type { FloorlineState } from "@/app/lib/floorline";

const labels: Record<FloorlineState, string> = {
  open: "Open",
  active: "Active",
  derisked: "De-risked",
  matured: "Matured",
  settled: "Settled",
  degraded: "Degraded",
};

const variants: Record<FloorlineState, "default" | "up" | "down" | "warn" | "neutral"> = {
  open: "neutral",
  active: "up",
  derisked: "warn",
  matured: "default",
  settled: "neutral",
  degraded: "down",
};

export function StateBadge({ state }: { state: FloorlineState }) {
  return (
    <Badge variant={variants[state]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {labels[state]}
    </Badge>
  );
}
