/**
 * Floorline emblem — the safe. Money goes in, the floor locks the worst
 * case, the depositor gets it back: the dial and cross-handle are the one
 * brand accent. Geometry is single-sourced in scripts/make-logo.py
 * (public/logo.svg). Corner bolts knock out to the background color.
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
      <rect x={8} y={12} width={48} height={44} rx={9} fill="currentColor" />
      <circle
        cx={32}
        cy={34}
        r={13.5}
        fill="none"
        stroke="var(--accent, #3DDC97)"
        strokeWidth={3.5}
      />
      <path
        d="M32 25 V43 M23 34 H41"
        stroke="var(--accent, #3DDC97)"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <circle cx={32} cy={34} r={3.2} fill="var(--accent, #3DDC97)" />
      <g fill="var(--background, #0E0E10)">
        <circle cx={15.5} cy={19.5} r={1.9} />
        <circle cx={48.5} cy={19.5} r={1.9} />
        <circle cx={15.5} cy={48.5} r={1.9} />
        <circle cx={48.5} cy={48.5} r={1.9} />
      </g>
    </svg>
  );
}
