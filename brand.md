# Brand — OneShare

> Own $10 of NVIDIA in 60 seconds.

## Direction

**Editorial finance.** The product competes for trust with brokerages, not with memecoin casinos. Every surface reads like a precise financial instrument: true-gray monochrome, one money-green accent, hairline borders, tabular numbers, restrained motion. If a decoration doesn't communicate state or hierarchy, it doesn't ship.

## Palette

### Canvas & surfaces (dark, true neutral — no blue tint)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#0A0A0A` | App canvas |
| `--card` | `#101010` | Cards, panels |
| `--secondary` | `#161616` | Hover fills, secondary surfaces |
| `--input` | `#0D0D0D` | Inputs, wells |
| `--border` | `#1F1F1F` | Hairline borders |
| `--border-strong` | `#2E2E2E` | Hovered/focused borders |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--foreground` | `#F5F5F5` | Primary text |
| `--muted-foreground` | `#8A8A8A` | Secondary text (≥4.5:1 on card) |
| `--faint` | `#5C5C5C` | Disabled, decorative only |

### Semantic (money)

| Token | Hex | Usage |
|---|---|---|
| `--up` / `--accent` | `#16C784` | Gains, buys, success — the only brand accent |
| `--down` / `--destructive` | `#EA3943` | Losses, stops, errors |
| `--warning` | `#F7B750` | Pending states |
| `--up-soft` / `--down-soft` | 10% alpha | Tinted fills behind semantic text |

**Rule:** green and red appear *only* for money semantics. They never decorate non-financial UI.

### Buttons

- Primary: white fill (`#F5F5F5`) with black text. Hover: pure white.
- Secondary: `#161616` fill, hairline border.
- Ghost: transparent, hover fill `#161616`.
- Destructive: `#EA3943` fill, white text.

## Typography

- **Sans:** Geist — UI, headings, body.
- **Mono:** Geist Mono — every number, address, hash, ticker. Always `tabular-nums` (`num` utility).
- **Eyebrow labels:** 11px, uppercase, `letter-spacing: 0.08em`, `#8A8A8A` (`eyebrow` utility). Used to open every section.
- **Scale:** display 40–56px/tight · h1 28px · h2 20px · h3 16px · body 14px · small 13px · micro 11–12px.

## Shape

- Cards/panels: `rounded-xl` (12px)
- Buttons/inputs: `rounded-lg` (8px)
- Badges/chips: `rounded-md` or pill
- No `rounded-3xl`. Sharp reads financial.

## Depth

No drop shadows on cards. Separation = 1px hairline border + surface tone step. Shadows only for overlays (popover, dropdown): `0 8px 24px rgba(0,0,0,.5)`.

## Motion

- Enter: `fade-up` 400ms with 75/100/150/200/300ms stagger delays.
- State swap: `fade-in` 300ms.
- Marquee ticker: 40s linear.
- Everything respects `prefers-reduced-motion`.

## Voice

- Active, specific, numeric. "Own $10 of NVIDIA in 60 seconds."
- Never: revolutionary, guaranteed, passive income, tamper-proof.
- Disclose limits plainly: not audited, non-US only, issuer risk.

## Layout

- App: fixed desktop sidebar (240px) + content column (max 1100px). Mobile: top bar + bottom dock.
- Landing: single centered column (max 1100px), section rhythm 96–128px, hairline dividers between sections.
- Tables over card-grids for dense data (positions, activity).

---
_Active as of 2026-11-12. Replaces the previous gradient/blue system entirely._
