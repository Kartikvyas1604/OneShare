import { cn } from "@/app/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center",
        className
      )}
    >
      <Icon className="h-6 w-6 text-faint" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action && (
        <Button variant="primary" size="sm" href={action.href} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
