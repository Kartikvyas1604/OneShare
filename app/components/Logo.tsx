/**
 * Floorline emblem — the anchor. Dropped at the sea floor: the storm moves
 * the surface, the anchor holds the seabed — the "floor line" the product is
 * named for. Geometry is single-sourced in scripts/make-logo.py
 * (public/logo.svg). The mint stock bar is the one brand accent.
 */
export function Logo({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      <g stroke="currentColor" strokeLinecap="round">
        <circle cx={32} cy={9} r={5} strokeWidth={4.5} />
        <path d="M32 16 V50" strokeWidth={5.5} />
        <path d="M12 36 A22 22 0 0 0 52 36" strokeWidth={5.5} />
      </g>
      <path d="M20 26 H44" stroke="var(--accent, #3DDC97)" strokeWidth={5.5} strokeLinecap="round" />
      <g fill="currentColor">
        <path d="M12 36 L3.5 29.5 L12.5 29 Z" />
        <path d="M52 36 L60.5 29.5 L51.5 29 Z" />
      </g>
    </svg>
  );
}
