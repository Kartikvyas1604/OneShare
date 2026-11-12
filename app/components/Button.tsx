import { cn } from "@/app/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-glow-brand hover:bg-primary/90 active:scale-[0.98] active:translate-y-px",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] active:translate-y-px",
    outline:
      "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.98] active:translate-y-px",
    ghost:
      "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.98] active:translate-y-px",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] active:translate-y-px",
  };

  const sizes = {
    default: "h-12 px-5 text-sm font-semibold",
    sm: "h-9 px-3 text-xs font-medium",
    lg: "h-14 px-6 text-base font-semibold",
    icon: "h-11 w-11",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
