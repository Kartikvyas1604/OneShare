import { cn } from "@/app/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "buy" | "sell";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  href?: string;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  children,
  disabled,
  href,
  ...props
}: ButtonProps) {
  const variants = {
    // White fill, black text — the single most trusted CTA in dark UI
    primary:
      "bg-primary text-primary-foreground hover:bg-white active:translate-y-px disabled:opacity-40",
    secondary:
      "border border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-[#1a1a1a] active:translate-y-px disabled:opacity-40",
    ghost:
      "text-muted-foreground hover:text-foreground hover:bg-secondary active:translate-y-px disabled:opacity-40",
    destructive:
      "bg-destructive text-destructive-foreground hover:brightness-110 active:translate-y-px disabled:opacity-40",
    buy: "bg-up text-[#06251a] font-semibold hover:brightness-105 active:translate-y-px disabled:opacity-40",
    sell: "bg-down text-white font-semibold hover:brightness-110 active:translate-y-px disabled:opacity-40",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-[13px]",
    lg: "h-12 px-5 text-sm",
    icon: "h-10 w-10",
  };

  const classes = cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
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
