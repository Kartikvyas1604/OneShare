import { cn } from "@/app/lib/utils";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label className="eyebrow" htmlFor={id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-input px-3.5 text-sm text-foreground transition-colors placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-down" : "border-border hover:border-border-strong"
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-down">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
