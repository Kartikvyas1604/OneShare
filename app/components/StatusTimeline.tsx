import { cn } from "@/app/lib/utils";
import { PositionState } from "@/app/lib/data";

const steps: { key: PositionState; label: string }[] = [
  { key: "created", label: "Open" },
  { key: "funding", label: "Fund" },
  { key: "buying", label: "Buy" },
  { key: "active", label: "Live" },
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
    <ol className="flex items-start">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <li key={step.key} className="relative flex-1">
            {idx > 0 && (
              <div
                className={cn(
                  "absolute right-[calc(50%+14px)] top-[5px] h-px w-[calc(100%-28px)]",
                  isCompleted || isCurrent ? "bg-up" : "bg-border"
                )}
                aria-hidden
              />
            )}
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "z-10 h-2.5 w-2.5 rounded-full border-2 bg-background",
                  isCompleted
                    ? "border-up bg-up"
                    : isCurrent
                      ? "border-up"
                      : "border-border-strong"
                )}
                aria-current={isCurrent ? "step" : undefined}
              />
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
