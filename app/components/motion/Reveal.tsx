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
