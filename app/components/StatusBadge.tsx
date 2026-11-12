import { Badge } from "./Badge";
import { PositionState } from "@/app/lib/data";

const labels: Record<PositionState, string> = {
  created: "Created",
  funding: "Funding",
  buying: "Buying",
  active: "Active",
  selling: "Selling",
  closed: "Closed",
  withdrawn: "Withdrawn",
  refunding: "Refunding",
};

const variants: Record<PositionState, "default" | "up" | "down" | "warn" | "neutral"> = {
  created: "neutral",
  funding: "warn",
  buying: "warn",
  active: "up",
  selling: "warn",
  closed: "neutral",
  withdrawn: "neutral",
  refunding: "down",
};

export function StatusBadge({ state }: { state: PositionState }) {
  return (
    <Badge variant={variants[state]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {labels[state]}
    </Badge>
  );
}
