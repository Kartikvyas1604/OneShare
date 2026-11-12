"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RECORDED_RUN } from "@/app/lib/crash-sim";
import { formatUsd } from "@/app/lib/utils";
import { ArrowRight } from "lucide-react";

const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1];

/**
 * Hero session panel — the recorded −45% crash with a Naive/Floor toggle,
 * Obligor-style. Numbers come straight from the deterministic recorded run
 * (seed 20261112), never invented.
 */
export function FloorToggleWindow() {
  const [floored, setFloored] = useState(true);
  const reduced = useReducedMotion();

  const naive = RECORDED_RUN.arms[0];
  const flooredArm = RECORDED_RUN.arms[1];
  const arm = floored ? flooredArm : naive;
  const kept = arm.medianTerminalUsd;
  const drawdown = arm.medianMaxDrawdownPct;

  return (
    <div className="overflow-hidden engraved rounded-2xl bg-card shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="num ml-2 text-[11px] text-muted-foreground">
          floorline-demo.near / vault / 8f3a1c42
        </span>
        <span className="num ml-auto rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
          recorded run · −45% · seed 20261112
        </span>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">A −45% crash hits a $1,000 position</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="eyebrow">You keep</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={floored ? "floor" : "naive"}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: EASE_OUT }}
                  className={`num text-3xl font-semibold tracking-tight md:text-4xl ${
                    floored ? "text-foreground" : "text-down"
                  }`}
                >
                  {formatUsd(kept)}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="num mt-1 text-[11px] text-muted-foreground">
              median terminal · max drawdown {drawdown.toFixed(1)}%
            </p>
          </div>

          {/* The toggle */}
          <div
            role="group"
            aria-label="Compare a naive position with a floored position"
            className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-border bg-input p-1"
          >
            {(
              [
                { label: "With floor", active: true },
                { label: "Naive 100%", active: false },
              ] as const
            ).map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={floored === t.active}
                onClick={() => setFloored(t.active)}
                className={`num h-7 rounded-md px-3 text-xs font-medium transition-colors duration-100 focus-visible:outline-none ${
                  floored === t.active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          <Cell label="Deposit" value="$1,000.00" />
          <Cell label="Reserve" value={floored ? "$900.00" : "—"} sub={floored ? "escrowed, out of the trade path" : "never set aside"} />
          <Cell label="Risk budget" value={floored ? "$100.00" : "$1,000.00"} sub={floored ? "the only bucket exposed" : "everything exposed"} />
          <Cell
            label="Worst case"
            value={floored ? "$900.00" : "$0.00"}
            sub={floored ? "set before you deposit" : "the market decides"}
            tone={floored ? "up" : "down"}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Deterministic — same seed, same numbers. Run it live with all three arms in the crash
            test.
          </p>
          <Link
            href="/crash"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
          >
            Open the crash test
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p
        className={`num mt-1 text-sm font-semibold ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
