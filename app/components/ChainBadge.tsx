import { cn } from "@/app/lib/utils";

const chainStyles: Record<string, string> = {
  near: "bg-success/15 text-success border-success/25",
  solana: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  base: "bg-brand-500/15 text-brand-400 border-brand-500/25",
  ethereum: "bg-muted text-foreground border-border",
};

export function ChainBadge({ chain, className }: { chain: string; className?: string }) {
  const key = chain.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        chainStyles[key] ?? "bg-muted text-foreground border-border",
        className
      )}
    >
      {chain}
    </span>
  );
}
