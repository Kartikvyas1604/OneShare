/**
 * Floorline emblem — the bank facade. Pediment, three columns, two base
 * steps, and the entablature beam in the brand accent: that beam is the
 * floor line the product is named for. Geometry is single-sourced in
 * scripts/make-logo.py (public/logo.svg).
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
      <path d="M32 6 L56 19 H8 Z" fill="currentColor" />
      <rect x={9} y={22} width={46} height={5.5} rx={1.6} fill="var(--accent, #3DDC97)" />
      <rect x={14} y={31} width={7} height={17} rx={2.4} fill="currentColor" />
      <rect x={28.5} y={31} width={7} height={17} rx={2.4} fill="currentColor" />
      <rect x={43} y={31} width={7} height={17} rx={2.4} fill="currentColor" />
      <rect x={10} y={51} width={44} height={5} rx={2} fill="currentColor" />
      <rect x={6} y={58} width={52} height={5} rx={2} fill="currentColor" />
    </svg>
  );
}
