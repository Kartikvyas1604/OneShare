"use client";

import { Button } from "@/app/components/Button";

export default function MarketingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <p className="eyebrow">Something broke</p>
        <h1 className="display mt-2 text-2xl text-foreground">This view failed to render</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The error is logged with a correlation id. Retry the section — if it persists, the
          repository issue tracker is the fastest channel.
        </p>
        <Button className="mt-6 w-full" onClick={reset}>
          Try again
        </Button>
        <Button className="mt-2 w-full" variant="ghost" href="/">
          Back to the homepage
        </Button>
      </div>
    </div>
  );
}
