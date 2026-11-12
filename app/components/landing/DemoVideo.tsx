"use client";

import { useState } from "react";
import { Button } from "@/app/components/Button";
import { VideoOff } from "lucide-react";
import { Reveal } from "@/app/components/motion/Reveal";

/**
 * Embedded demo video (§6.5 "/" contents; demo fallback 1). While the 75s cut
 * is still recording, the failed-load state routes to the live crash test —
 * the page never shows a broken player.
 */
export function DemoVideo() {
  const [failed, setFailed] = useState(false);

  return (
    <section id="demo" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="eyebrow">The demo</p>
          <h2 className="display mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
            75 seconds, three numbers.
          </h2>
        </Reveal>

        <Reveal delay={0.12} className="mx-auto mt-10 max-w-3xl">
          {failed ? (
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
                <span className="num ml-2 text-[11px] text-muted-foreground">demo.mp4</span>
              </div>
              <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <VideoOff className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-[13px] font-medium text-foreground">
                  The recorded run isn&apos;t cut yet.
                </p>
                <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                  Watch the mechanism live instead: the crash test runs deterministic numbers in
                  your browser, seed 20261112.
                </p>
                <Button variant="secondary" href="/crash">
                  Run the crash test
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
                <span className="num ml-2 text-[11px] text-muted-foreground">
                  Floorline · demo · 75s
                </span>
              </div>
              <div className="relative aspect-video bg-input">
                <video
                  className="h-full w-full"
                  controls
                  preload="none"
                  onError={() => setFailed(true)}
                  aria-label="Floorline demo video"
                >
                  <source src="/demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
