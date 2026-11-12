import { cn } from "@/app/lib/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" aria-hidden />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
