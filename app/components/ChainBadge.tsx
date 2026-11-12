import { cn } from "@/app/lib/utils";

const dotColor: Record<string, string> = {
  solana: "bg-[#9945FF]",
  near: "bg-[#3DDC97]",
  base: "bg-[#0052FF]",
  ethereum: "bg-[#8F8F96]",
};

export function ChainBadge({ chain, className }: { chain: string; className?: string }) {
  const key = chain.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[key] ?? "bg-faint")} aria-hidden />
      {chain}
    </span>
  );
}
