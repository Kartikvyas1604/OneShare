import { cn } from "@/app/lib/utils";
import { PositionState } from "@/app/lib/data";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const steps: { key: PositionState; label: string }[] = [
  { key: "created", label: "Open" },
  { key: "funding", label: "Fund" },
  { key: "buying", label: "Buy" },
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
];

const order: PositionState[] = ["created", "funding", "buying", "active", "closed"];

const stateIndexMap: Partial<Record<PositionState, number>> = {
  refunding: 1,
  withdrawn: 4,
};

export function StatusTimeline({ state }: { state: PositionState }) {
  const currentIndex = stateIndexMap[state] ?? order.indexOf(state);

  return (
    <div className="relative flex items-start justify-between">
      {/* Background line */}
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-border" aria-hidden />
      {/* Progress line */}
      <div
        className="absolute left-0 top-4 h-0.5 bg-success transition-all duration-500"
        style={{
          width: `${Math.max(0, Math.min(100, (currentIndex / (order.length - 1)) * 100))}%`,
        }}
        aria-hidden
      />

      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const Icon = isCompleted ? CheckCircle2 : isCurrent ? Clock : Circle;

        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-colors",
                isCompleted
                  ? "border-success bg-success/15 text-success"
                  : isCurrent
                    ? "border-brand-500 bg-brand-500/15 text-brand-400"
                    : "border-border bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
