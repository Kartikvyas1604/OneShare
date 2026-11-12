import { cn } from "@/app/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.05]", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-card p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}
