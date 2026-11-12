"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1]; // brand --ease-out

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds before this element starts — use i * STAGGER for lists. */
  delay?: number;
  offsetY?: number;
  once?: boolean;
  /** Render as a list item inside <ol>/<ul> to keep list semantics. */
  as?: "div" | "li";
}

/**
 * Scroll-reveal: fade-up as the element enters the viewport, brand easing,
 * once by default. Reduced motion renders static (no transform, no fade).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  offsetY = 10,
  once = true,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return as === "li" ? (
      <li className={className}>{children}</li>
    ) : (
      <div className={className}>{children}</div>
    );
  }

  if (as === "li") {
    return (
      <motion.li
        className={className}
        initial={{ opacity: 0, y: offsetY }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, margin: "-64px 0px" }}
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
      viewport={{ once, margin: "-64px 0px" }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger presets — see page-load-animations skill, list-stagger. */
export const STAGGER = {
  /** Dense grids (6+ cards). */
  dense: 0.06,
  /** Feature rows, steps (2–5 items). */
  row: 0.12,
} as const;
