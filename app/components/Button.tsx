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
    primary: "bg-primary text-primary-foreground hover:bg-white active:translate-y-px",
    secondary:
      "border border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-[#222226] active:translate-y-px",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary active:translate-y-px",
    destructive:
      "bg-destructive text-destructive-foreground hover:brightness-105 active:translate-y-px",
    buy: "bg-up text-accent-foreground font-semibold hover:brightness-105 active:translate-y-px",
    sell: "bg-down text-white font-semibold hover:brightness-105 active:translate-y-px",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-[13px]",
    lg: "h-12 px-6 text-sm",
    icon: "h-10 w-10",
  };

  const classes = cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40",
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
    <button className={classes} disabled={disabled || isLoading} aria-busy={isLoading} {...props}>
      {content}
    </button>
  );
}
