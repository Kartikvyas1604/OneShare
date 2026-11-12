/**
 * Motion timing constants — a plain server-safe module so both server
 * components and "use client" modules can import them. (Plain exports from
 * a "use client" file become client-reference proxies on the server and
 * cannot be read there.)
 */

/** Seconds between staggered items — see page-load-animations skill, list-stagger. */
export const STAGGER = {
  /** Dense grids (6+ cards). */
  dense: 0.06,
  /** Feature rows, steps (2–5 items). */
  row: 0.12,
} as const;

/** Brand ease-out — cubic-bezier(0, 0, 0.2, 1). */
export const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1];
