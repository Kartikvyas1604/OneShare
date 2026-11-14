#!/usr/bin/env python3
"""Generate the Floorline logo assets from the mark geometry + the real
Instrument Serif wordmark (outlined to paths, so the assets carry no font
dependency).

Assets written:
  public/logo-mark.svg        mark only, for dark surfaces (ivory + accent)
  public/logo-mark-mono.svg   mark only, single currentColor (any surface)
  public/logo-dark.svg        full horizontal lockup, for dark surfaces
  public/logo-light.svg       full horizontal lockup, for light surfaces
  app/icon.svg                favicon tile (near-black canvas, rounded)

The mark — "the line that holds": a falling price line lands on a horizontal
floor and stops there; the wedge between them is the bounded loss, tinted in
the one semantic accent. Geometry is defined once, below, in a 32×32 box.

Run:  python3 scripts/make-logo.py
"""

from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT_PATH = ROOT / "assets/brand/InstrumentSerif-Regular.ttf"
WORDMARK = "Floorline"

# ─── Brand palette (brand.md) ────────────────────────────────────────────
IVORY = "#EDEBE4"     # --foreground
INK = "#0E0E10"       # --background
ACCENT = "#3DDC97"    # --up / --accent — the only color in the system
WEDGE_OPACITY = 0.16

# ─── Mark geometry (defined once) ────────────────────────────────────────
# viewBox 0 0 32 32 — the line falls, the floor catches it at center, and the
# accent dot marks the point where it is held (the floor held = the promise).
MARK_WEDGE = "M5 6 L16 25 L5 25 Z"       # the bounded loss between line and floor
MARK_FALL = "M5 6 L16 25"                # the falling line, lands ON the floor
MARK_FLOOR = "M4 25 H28"                 # the floor — it holds
MARK_LANDING = (16, 25)                  # the caught point (accent dot)
MARK_LANDING_R = 2.4                     # dot radius
MARK_STROKE = 3
MARK_TEXT_START_X = 37                   # wordmark origin in the lockup
WORDMARK_EM_PX = 26                      # cap height ≈ 18.7px, baseline at y=25


def glyph_paths(font: TTFont, text: str, scale: float, dx: float, dy: float) -> tuple[str, float]:
    """Return (svg path d for `text` with baseline at dy, total width in px)."""
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    kern = _kern_map(font)

    parts: list[str] = []
    x_units = 0.0
    prev = None
    for ch in text:
        g = cmap[ord(ch)]
        if prev is not None:
            x_units += kern.get((prev, g), 0)
        pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.1f}")
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, dx + x_units * scale, dy))
        glyph_set[g].draw(tpen)
        d = pen.getCommands()
        if d:
            parts.append(d)
        x_units += hmtx[g][0]
        prev = g
    return " ".join(parts), x_units * scale


def _kern_map(font: TTFont) -> dict[tuple[str, str], float]:
    """Collect GPOS PairPos XAdvance values (formats 1 and 2)."""
    kern: dict[tuple[str, str], float] = {}
    gpos = font.get("GPOS")
    if gpos is None:
        return kern
    lookups = gpos.table.LookupList.Lookup
    for feature in gpos.table.FeatureList.FeatureRecord:
        if feature.FeatureTag != "kern":
            continue
        for li in feature.Feature.LookupListIndex:
            lookup = lookups[li]
            for st in lookup.SubTable:
                if lookup.LookupType == 9:  # Extension
                    st = st.ExtSubTable
                coverage = st.Coverage.glyphs
                if getattr(st, "Format", 1) == 1:
                    pair_sets = getattr(st, "PairSet", None) or []
                    for i, g1 in enumerate(coverage):
                        if i >= len(pair_sets):
                            continue
                        for pvr in pair_sets[i].PairValueRecord:
                            v1 = pvr.Value1
                            x = getattr(v1, "XAdvance", 0) if v1 else 0
                            if x:
                                kern[(g1, pvr.SecondGlyph)] = x
                elif getattr(st, "Format", 1) == 2:
                    cd1, cd2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                    for g1 in coverage:
                        c1 = cd1.get(g1, 0)
                        for c2 in range(st.Class2Count):
                            rec = st.Class1Record[c1].Class2Record[c2]
                            x = rec.Value1.XAdvance if rec.Value1 else 0
                            if x:
                                for g2, cls in cd2.items():
                                    if cls == c2:
                                        kern.setdefault((g1, g2), x)
    return kern


def mark_group(stroke: str, accent: str, wedge_opacity: float) -> str:
    lx, ly = MARK_LANDING
    return (
        f'<path d="{MARK_WEDGE}" fill="{accent}" opacity="{wedge_opacity}"/>\n'
        f'  <path d="{MARK_FALL}" stroke="{stroke}" stroke-width="{MARK_STROKE}" '
        'stroke-linecap="round" stroke-linejoin="round"/>\n'
        f'  <path d="{MARK_FLOOR}" stroke="{stroke}" stroke-width="{MARK_STROKE}" '
        'stroke-linecap="round"/>\n'
        f'  <circle cx="{lx}" cy="{ly}" r="{MARK_LANDING_R}" fill="{accent}"/>'
    )


def write(path: Path, content: str) -> None:
    path.write_text(content)
    print("wrote", path.relative_to(ROOT))


def main() -> None:
    font = TTFont(str(FONT_PATH))
    upem = font["head"].unitsPerEm
    scale = WORDMARK_EM_PX / upem

    # Mark-only assets
    write(ROOT / "public/logo-mark.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">\n'
        f'  {mark_group(IVORY, ACCENT, WEDGE_OPACITY)}\n'
        '</svg>\n'
    ))
    write(ROOT / "public/logo-mark-mono.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">\n'
        f'  {mark_group("currentColor", "currentColor", WEDGE_OPACITY)}\n'
        '</svg>\n'
    ))

    # Favicon tile — the brand canvas behind the mark
    write(ROOT / "app/icon.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        f'  <rect width="64" height="64" rx="14" fill="{INK}"/>\n'
        '  <g transform="translate(6.4 7.2) scale(1.6)" fill="none">\n'
        f'    {mark_group(IVORY, ACCENT, WEDGE_OPACITY + 0.04)}\n'
        '  </g>\n'
        '</svg>\n'
    ))

    # Full lockups — the wordmark baseline sits on the mark's floor line (y=25)
    word_d, word_w = glyph_paths(font, WORDMARK, scale, MARK_TEXT_START_X, 25)
    for name, stroke in (("logo-dark", IVORY), ("logo-light", INK)):
        width = MARK_TEXT_START_X + word_w + 3
        write(ROOT / f"public/{name}.svg", (
            '<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 {width:.1f} 32" fill="none">\n'
            f'  {mark_group(stroke, ACCENT, WEDGE_OPACITY)}\n'
            f'  <path d="{word_d}" fill="{stroke}"/>\n'
            '</svg>\n'
        ))

    print(f"wordmark width: {word_w:.1f}px at {WORDMARK_EM_PX}px em")


if __name__ == "__main__":
    main()
