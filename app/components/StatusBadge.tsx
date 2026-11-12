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

const variants: Record<
  PositionState,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "brand"
> = {
  created: "secondary",
  funding: "warning",
  buying: "warning",
  active: "success",
  selling: "warning",
  closed: "secondary",
  withdrawn: "secondary",
  refunding: "destructive",
};

export function StatusBadge({ state }: { state: PositionState }) {
  return <Badge variant={variants[state]}>{labels[state]}</Badge>;
}
