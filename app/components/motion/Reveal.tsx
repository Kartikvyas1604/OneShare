"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT } from "./timing";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds before this element starts — use i * STAGGER for lists. */
  delay?: number;
  offsetY?: number;
  /** Replay on every scroll-past (obligor behavior). Default true. */
  replay?: boolean;
  /** Render as a list item inside <ol>/<ul> to keep list semantics. */
  as?: "div" | "li";
}

/**
 * Scroll-reveal: fade-up as the element enters the viewport, brand easing.
 * Like obligor's RevealSection, the reveal replays in both directions —
 * it resets once fully out of view and re-runs when scrolled back.
 * Reduced motion renders static (no transform, no fade).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  offsetY = 10,
  replay = true,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const once = !replay;

  if (reduced) {
    return as === "li" ? (
      <li className={className}>{children}</li>
    ) : (
      <div className={className}>{children}</div>
    );
  }

  const viewport = { once, amount: 0.2, margin: "0px 0px -10% 0px" } as const;

  if (as === "li") {
    return (
      <motion.li
        className={className}
        initial={{ opacity: 0, y: offsetY }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, ease: EASE_OUT, delay }}
      >
        {children}
      </motion.li>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offsetY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.45, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
