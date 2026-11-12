import { cn } from "@/app/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  href?: string;
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  isLoading,
  children,
  disabled,
  href,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-glow-brand hover:from-brand-300 hover:to-brand-500 active:scale-[0.98] active:translate-y-px",
    secondary:
      "border border-white/[0.08] bg-white/[0.05] text-foreground hover:bg-white/[0.09] active:scale-[0.98] active:translate-y-px",
    outline:
      "border border-white/[0.1] bg-transparent text-foreground hover:border-white/[0.2] hover:bg-white/[0.04] active:scale-[0.98] active:translate-y-px",
    ghost:
      "bg-transparent text-foreground hover:bg-white/[0.06] active:scale-[0.98] active:translate-y-px",
    destructive:
      "bg-gradient-to-b from-red-500 to-red-600 text-white hover:brightness-110 active:scale-[0.98] active:translate-y-px",
  };

  const sizes = {
    default: "h-12 px-5 text-sm font-semibold",
    sm: "h-9 px-3 text-xs font-medium",
    lg: "h-14 px-6 text-base font-semibold",
    icon: "h-11 w-11",
  };

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  const content = (
    <>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} aria-busy={isLoading}>
        {content}
      </a>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {content}
    </button>
  );
}
