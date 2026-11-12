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
        "flex flex-col gap-3 rounded-xl border border-down/25 bg-down-soft p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 text-down">
        <AlertCircle className="h-4 w-4" aria-hidden />
        <p className="text-[13px] font-medium">{title}</p>
      </div>
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <div>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
