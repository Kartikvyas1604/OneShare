#!/usr/bin/env python3
"""Generate the Floorline logo assets — the bank facade.

The mark: a classical bank building — pediment, three columns, two base
steps — with the entablature beam in the brand accent. That beam is the
product's namesake: the floor line your money stands on.

Assets written:
  public/logo.svg            official lockup — emblem + wordmark on white
  public/logo-emblem.svg     emblem only on white (avatars, stamps)
  public/logo-mark-dark.svg  emblem only, ivory strokes, for dark surfaces
  app/icon.svg               favicon tile (white rounded tile, facade)

Favicon: app/favicon.ico is a rendered snapshot of app/icon.svg (16/32/48).
Regenerate it manually after changing the geometry:
  qlmanage -t -s 1024 -o <tmp> app/icon.svg
  → Pillow: crop, resize 48/32/16, save app/favicon.ico.
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
INK = "#0E0E10"       # --background — facade + text on white
IVORY = "#EDEBE4"     # --foreground — facade on dark surfaces
ACCENT = "#3DDC97"    # --up / --accent — the beam (the floorline)
WHITE = "#FFFFFF"

# ─── Emblem geometry (defined once; 64×64 box) ───────────────────────────
PEDIMENT = "M32 6 L56 19 H8 Z"           # the roof
BEAM = dict(x=9, y=22, w=46, h=5.5, rx=1.6)   # the entablature — the accent
COLUMNS = [(14, 31), (28.5, 31), (43, 31)]    # x, y — each 7×17, rx 2.4
STEP1 = dict(x=10, y=51, w=44, h=5, rx=2)
STEP2 = dict(x=6, y=58, w=52, h=5, rx=2)

WORDMARK_EM_PX = 30
LOCKUP_PAD = 14
EMBLEM_TOP = 2
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
    b, s1, s2 = BEAM, STEP1, STEP2
    columns = "\n    ".join(
        f'<rect x="{x}" y="{y}" width="7" height="17" rx="2.4" fill="{ink}"/>'
        for x, y in COLUMNS
    )
    return (
        f'  <path d="{PEDIMENT}" fill="{ink}"/>\n'
        f'  <rect x="{b["x"]}" y="{b["y"]}" width="{b["w"]}" height="{b["h"]}" '
        f'rx="{b["rx"]}" fill="{accent}"/>\n'
        f'  {columns}\n'
        f'  <rect x="{s1["x"]}" y="{s1["y"]}" width="{s1["w"]}" height="{s1["h"]}" '
        f'rx="{s1["rx"]}" fill="{ink}"/>\n'
        f'  <rect x="{s2["x"]}" y="{s2["y"]}" width="{s2["w"]}" height="{s2["h"]}" '
        f'rx="{s2["rx"]}" fill="{ink}"/>'
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
        f'  <g transform="translate({ex:.1f} {EMBLEM_TOP})">\n'
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
        f'  {emblem_group(INK, ACCENT)}\n'
        '</svg>\n'
    ))

    # Emblem only, for dark surfaces (transparent background, ivory facade)
    write(ROOT / "public/logo-mark-dark.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
        'width="64" height="64">\n'
        f'  {emblem_group(IVORY, ACCENT)}\n'
        '</svg>\n'
    ))

    # Favicon tile: white rounded square, facade centered
    write(ROOT / "app/icon.svg", (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        f'  <rect width="64" height="64" rx="14" fill="{WHITE}"/>\n'
        f'  {emblem_group(INK, ACCENT)}\n'
        '</svg>\n'
    ))

    print(f"wordmark width: {word_w:.1f}px at {WORDMARK_EM_PX}px em; lockup {W:.1f}×{H}")


if __name__ == "__main__":
    main()
