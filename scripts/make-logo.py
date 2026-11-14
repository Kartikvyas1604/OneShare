#!/usr/bin/env python3
"""Generate the Floorline logo assets — the lifebuoy mark.

The mark: a float ring riding a green sea. When everything sinks, the ring
stays afloat — and the ring itself reads as a coin. The sea is the one
semantic accent (the market); the ring is ivory (your position).

The logo carries NO lettering. "Floorline" appears only as live text in the
product UI, next to the mark.

Assets written:
  public/logo-mark.svg       tiled mark (near-black canvas, sea clipped to it)
  public/logo-mark-mono.svg  single currentColor (ring + stripes, no tile)
  app/icon.svg               favicon tile (same as the tiled mark)

Favicon: app/favicon.ico is a rendered snapshot of app/icon.svg (16/32/48).
Regenerate it manually after changing the geometry:
  qlmanage -t -s 1024 -o <tmp> app/icon.svg
  python3 - <<'EOF'  (Pillow, resize 48/32/16, save app/favicon.ico)
Run:  python3 scripts/make-logo.py
"""

import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ─── Brand palette (brand.md) ────────────────────────────────────────────
IVORY = "#EDEBE4"     # --foreground — the ring (your position)
INK = "#0E0E10"       # --background — the tile
ACCENT = "#3DDC97"    # --up / --accent — the sea (the market); the only color

# ─── Mark geometry (defined once; viewBox 0 0 64 64) ─────────────────────
RING_CX, RING_CY = 32.0, 27.0
RING_R_OUT = 16.0     # outer radius
RING_R_IN = 7.0       # hole radius
STRIKE_MID = (RING_R_OUT + RING_R_IN) / 2   # stripe centerline radius
STRIKE_W = 5.2                              # stripe stroke width
STRIKE_SPAN_DEG = 24.0                      # each stripe's angular span
STRIKE_CENTERS_DEG = (45.0, 135.0, 225.0, 315.0)

SEA_PATH = (
    "M0 46 C 9 40 18 40 27 46 C 36 52 45 52 54 46 "
    "C 58 43.5 61 42.5 64 43 L 64 64 L 0 64 Z"
)


def ring_point(cx: float, cy: float, r: float, deg: float) -> tuple[float, float]:
    """Point on a circle; deg is math-convention (CCW, 0 = +x, up is +y)."""
    rad = math.radians(deg)
    return (cx + r * math.cos(rad), cy - r * math.sin(rad))


def stripe_arc(center_deg: float) -> str:
    """SVG arc for one stripe, from θ-span/2 to θ+span/2 at the mid radius."""
    a1 = center_deg - STRIKE_SPAN_DEG / 2
    a2 = center_deg + STRIKE_SPAN_DEG / 2
    x1, y1 = ring_point(RING_CX, RING_CY, STRIKE_MID, a1)
    x2, y2 = ring_point(RING_CX, RING_CY, STRIKE_MID, a2)
    # math-CCW renders as sweep-flag 0 (screen y is flipped)
    return f"M{x1:.2f} {y1:.2f} A{STRIKE_MID:.2f} {STRIKE_MID:.2f} 0 0 0 {x2:.2f} {y2:.2f}"


def mark_group(stroke: str, accent: str) -> str:
    """Ring + hole + accent stripes. `stroke` = ring/ink color, `accent` = sea."""
    stripes = "\n    ".join(
        f'<path d="{stripe_arc(d)}" fill="none" stroke="{accent}" stroke-width="{STRIKE_W}"/>'
        for d in STRIKE_CENTERS_DEG
    )
    return (
        f'<circle cx="{RING_CX}" cy="{RING_CY}" r="{RING_R_OUT}" fill="{stroke}"/>\n'
        f'  <circle cx="{RING_CX}" cy="{RING_CY}" r="{RING_R_IN}" fill="{INK}"/>\n'
        f'  {stripes}'
    )


def write(path: Path, content: str) -> None:
    path.write_text(content)
    print("wrote", path.relative_to(ROOT))


def main() -> None:
    # Tiled mark: sea clipped to the tile, ring floating on it
    tile = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        '  <defs>\n'
        '    <clipPath id="tile"><rect width="64" height="64" rx="14"/></clipPath>\n'
        '  </defs>\n'
        f'  <rect width="64" height="64" rx="14" fill="{INK}"/>\n'
        f'  <g clip-path="url(#tile)"><path d="{SEA_PATH}" fill="{ACCENT}"/></g>\n'
        f'  {mark_group(IVORY, ACCENT)}\n'
        '</svg>\n'
    )
    write(ROOT / "app/icon.svg", tile)
    write(ROOT / "public/logo-mark.svg", tile)

    # Mono mark: one currentColor, no tile, no sea — works on any surface
    mono = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">\n'
        f'  {mark_group("currentColor", "currentColor")}\n'
        '</svg>\n'
    )
    write(ROOT / "public/logo-mark-mono.svg", mono)


if __name__ == "__main__":
    main()
