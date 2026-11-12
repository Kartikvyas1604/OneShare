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

export function StatusTimeline({ state }: { state: PositionState }) {
  const currentIndex = order.indexOf(state);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const Icon = isCompleted ? CheckCircle2 : isCurrent ? Clock : Circle;

        return (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
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
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "absolute h-0.5 w-[calc(25%-2rem)] translate-x-[calc(50%+1rem)]",
                  isCompleted ? "bg-success" : "bg-border"
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
