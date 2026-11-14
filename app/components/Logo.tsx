/**
 * Floorline mark — the lifebuoy. A float ring riding out the sea: when
 * everything sinks, the ring stays afloat — and the ring reads as a coin.
 * Geometry is single-sourced in scripts/make-logo.py (public/logo-mark.svg).
 * The tiled version (with the sea) lives in app/icon.svg.
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
      <circle cx={32} cy={27} r={16} fill="currentColor" />
      <circle cx={32} cy={27} r={7} fill="var(--background, #0E0E10)" />
      <g stroke="var(--accent, #3DDC97)" strokeWidth={5.2} fill="none">
        <path d="M41.65 20.74 A11.5 11.5 0 0 0 38.26 17.35" />
        <path d="M25.74 17.35 A11.5 11.5 0 0 1 22.35 20.74" />
        <path d="M22.35 33.26 A11.5 11.5 0 0 1 25.74 36.65" />
        <path d="M38.26 36.65 A11.5 11.5 0 0 0 41.65 33.26" />
      </g>
    </svg>
  );
}
