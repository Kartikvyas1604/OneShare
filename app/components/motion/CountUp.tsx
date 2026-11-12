"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  /** Final value. */
  value: number;
  /** ms to count from 0 once in view. */
  duration?: number;
  /** Static strings wrapped around the number — props must stay serializable
   * across the server/client boundary (no function props). */
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Count-up on scroll: starts when the element enters the viewport (once),
 * easeOutCubic to the final value. Reduced motion renders the final value.
 */
export function CountUp({ value, duration = 1_200, prefix = "", suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-64px 0px" });
  const reduced = useReducedMotion();
  // Start at 0 for both server and client render — no hydration mismatch.
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (reduced) {
        // Reduced motion: land on the final value immediately (in a frame
        // callback, not synchronously in the effect body).
        setDisplay(value);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased * 100) / 100);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {String(display)}
      {suffix}
    </span>
  );
}
