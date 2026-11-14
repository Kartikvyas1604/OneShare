#!/usr/bin/env python3
"""Generate the Floorline logo assets — the anchor lockup.

The mark: an anchor dropped at the sea floor. The storm moves the surface;
the anchor holds the seabed — the "floor line" the product is named for.
One mint accent on the stock bar; the wordmark is real Geist SemiBold
outlined to paths (no font dependency in the shipped assets).

Assets written:
  public/logo.svg          official lockup — emblem + wordmark on white
  public/logo-emblem.svg   emblem only on white (avatars, stamps)
  public/logo-mark-dark.svg  emblem only, ivory strokes, for dark surfaces
  app/icon.svg             favicon tile (white rounded tile, emblem)

Favicon: app/favicon.ico is a rendered snapshot of app/icon.svg (16/32/48).
Regenerate it manually after changing the geometry (see the repo runbook):
  qlmanage -t -s 1024 -o <tmp> app/icon.svg  → resize 48/32/16 with Pillow.

Run:  python3 scripts/make-logo.py
"""

from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FONT_PATH = ROOT / "assets/brand/Geist[wght].ttf"
WORDMARK = "Floorline"
WORDMARK_WEIGHT = 600

# ─── Brand palette (brand.md) ────────────────────────────────────────────
INK = "#0E0E10"       # --background — emblem + text on white
IVORY = "#EDEBE4"     # --foreground — emblem strokes on dark surfaces
ACCENT = "#3DDC97"    # --up / --accent — the stock bar; the only color
WHITE = "#FFFFFF"

# ─── Emblem geometry (defined once; 64×64 box) ───────────────────────────
RING = dict(cx=32, cy=9, r=5, w=4.5)
SHANK = "M32 16 V50"                    # stroke 5.5
STOCK = "M20 26 H44"                    # accent, stroke 5.5
ARMS = "M12 36 A22 22 0 0 0 52 36"      # stroke 5.5
FLUKE_L = "M12 36 L3.5 29.5 L12.5 29 Z"  # solid
FLUKE_R = "M52 36 L60.5 29.5 L51.5 29 Z"
EMBLEM_STROKE = 5.5

WORDMARK_EM_PX = 30
LOCKUP_PAD = 14
EMBLEM_TOP = 8
WORDMARK_BASELINE = 96


def glyph_paths(font: TTFont, text: str, scale: float) -> tuple[str, float]:
    """SVG path for `text` (baseline at y=0), total width in px. GPOS-kerned."""
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
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, x_units * scale, 0))
        glyph_set[g].draw(tpen)
        d = pen.getCommands()
        if d:
            parts.append(d)
        x_units += hmtx[g][0]
        prev = g
    return " ".join(parts), x_units * scale


def _kern_map(font: TTFont) -> dict[tuple[str, str], float]:
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


def emblem_group(ink: str, accent: str) -> str:
    return (
        f'<circle cx="{RING["cx"]}" cy="{RING["cy"]}" r="{RING["r"]}" stroke="{ink}" '
        f'stroke-width="{RING["w"]}"/>\n'
        f'    <path d="{SHANK}" stroke="{ink}" stroke-width="{EMBLEM_STROKE}"/>\n'
        f'    <path d="{STOCK}" stroke="{accent}" stroke-width="{EMBLEM_STROKE}"/>\n'
        f'    <path d="{ARMS}" stroke="{ink}" stroke-width="{EMBLEM_STROKE}"/>\n'
        f'    <g fill="{ink}">\n'
        f'      <path d="{FLUKE_L}"/>\n'
        f'      <path d="{FLUKE_R}"/>\n'
        f'    </g>'
    )


def write(path: Path, content: str) -> None:
    path.write_text(content)
    print("wrote", path.relative_to(ROOT))


def main() -> None:
    font = TTFont(str(FONT_PATH))
    if "fvar" in font:
        instantiateVariableFont(font, {"wght": WORDMARK_WEIGHT}, inplace=True)
    upem = font["head"].unitsPerEm
    scale = WORDMARK_EM_PX / upem

    word_d, word_w = glyph_paths(font, WORDMARK, scale)
    W = word_w + 2 * LOCKUP_PAD
    ex = (W - 64) / 2
    H = WORDMARK_BASELINE + 18

    # Official lockup on white
    write(ROOT / "public/logo.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {W:.1f} {H}">\n'
        f'  <rect width="{W:.1f}" height="{H}" fill="{WHITE}"/>\n'
        f'  <g transform="translate({ex:.1f} {EMBLEM_TOP})" '
        'fill="none" stroke-linecap="round">\n'
        f'    {emblem_group(INK, ACCENT)}\n'
        '  </g>\n'
        f'  <g transform="translate({LOCKUP_PAD} {WORDMARK_BASELINE})">\n'
        f'    <path d="{word_d}" fill="{INK}"/>\n'
        '  </g>\n'
        '</svg>\n'
    ))

    # Emblem only, on white
    write(ROOT / "public/logo-emblem.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
        'width="64" height="64">\n'
        f'  <rect width="64" height="64" fill="{WHITE}"/>\n'
        '  <g fill="none" stroke-linecap="round">\n'
        f'    {emblem_group(INK, ACCENT)}\n'
        '  </g>\n'
        '</svg>\n'
    ))

    # Emblem only, for dark surfaces (transparent background)
    write(ROOT / "public/logo-mark-dark.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
        'width="64" height="64" fill="none">\n'
        f'  {emblem_group(IVORY, ACCENT)}\n'
        '</svg>\n'
    ))

    # Favicon tile: white rounded square, emblem centered
    write(ROOT / "app/icon.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        f'  <rect width="64" height="64" rx="14" fill="{WHITE}"/>\n'
        '  <g transform="translate(4.8 7.2) scale(0.85)" fill="none" '
        'stroke-linecap="round">\n'
        f'    {emblem_group(INK, ACCENT)}\n'
        '  </g>\n'
        '</svg>\n'
    ))

    print(f"wordmark width: {word_w:.1f}px at {WORDMARK_EM_PX}px em; lockup {W:.1f}×{H}")


if __name__ == "__main__":
    main()
