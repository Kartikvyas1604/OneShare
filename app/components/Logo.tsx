/**
 * Floorline mark — "the line that holds."
 * A falling price line lands on a horizontal floor and is held; the wedge
 * between them is the bounded loss, tinted in the one semantic accent. The
 * geometry is the single source in scripts/make-logo.py (public/logo*.svg).
 */
export function Logo({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <path d="M5 6 L16 25 L5 25 Z" fill="var(--accent, #3DDC97)" opacity={0.16} />
      <path
        d="M5 6 L16 25"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 25 H28" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <circle cx={16} cy={25} r={2.4} fill="var(--accent, #3DDC97)" />
    </svg>
  );
}
