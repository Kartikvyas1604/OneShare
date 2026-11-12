import { cn } from "@/app/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "up" | "down" | "warn" | "neutral";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "border-border bg-secondary text-secondary-foreground",
    up: "border-up/25 bg-up-soft text-up",
    down: "border-down/25 bg-down-soft text-down",
    warn: "border-warning/25 bg-warning/10 text-warning",
    neutral: "border-border bg-transparent text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
