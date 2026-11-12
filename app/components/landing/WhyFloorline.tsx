import { Check, X } from "lucide-react";
import { Badge } from "@/app/components/Badge";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";

const columns = [
  {
    title: "Naive tokenized equity",
    badge: { label: "All-or-nothing", variant: "down" as const },
    points: [
      { text: "The whole deposit rides on one asset", tone: "down" as const },
      { text: "A 3am panic sell is one tap away", tone: "down" as const },
      { text: "No cap — the market sets your loss", tone: "down" as const },
      { text: "Unwind the assets before you can sell out", tone: "down" as const },
    ],
  },
  {
    title: "Floorline",
    badge: { label: "Floored", variant: "up" as const },
    points: [
      { text: "The reserve leaves your trade path at deposit", tone: "up" as const },
      { text: "The de-risk rule sells so you don't have to", tone: "up" as const },
      { text: "Worst case pre-committed, in dollars", tone: "up" as const },
      { text: "Transferable NEP-171 — sell without unwinding", tone: "up" as const },
    ],
  },
];

export function WhyFloorline() {
  return (
    <section id="why" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="eyebrow">Why Floorline</p>
          <h2 className="display mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
            All-or-nothing exposure falls short.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          {columns.map((col, idx) => (
            <Reveal
              key={col.title}
              delay={idx * STAGGER.row}
              className="bg-card p-6 md:p-8"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                  {col.title}
                </h3>
                <Badge variant={col.badge.variant}>{col.badge.label}</Badge>
              </div>
              <ul className="mt-6 divide-y divide-border">
                {col.points.map((p) => (
                  <li key={p.text} className="flex items-start gap-3 py-3.5 text-[14px] leading-relaxed text-foreground">
                    {p.tone === "up" ? (
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-up-soft text-up">
                        <Check className="h-2.5 w-2.5" aria-hidden />
                      </span>
                    ) : (
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-faint">
                        <X className="h-2.5 w-2.5" aria-hidden />
                      </span>
                    )}
                    {p.text}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <Reveal delay={STAGGER.row}>
          <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
            The reserve is escrowed so a 3am panic sell cannot touch it, and the de-risk rule is
            automated. You are buying discipline, not a floor.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
