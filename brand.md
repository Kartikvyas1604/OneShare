# Brand — Floorline

> Set your own worst case. The floor holds.

## Logo — "the line that holds"

A falling price line lands on a horizontal floor and is held. The wedge between
the line and the floor is the bounded loss, tinted in the one semantic accent;
the accent dot marks the point where the floor catches the line. The wordmark's
baseline sits on the floor line itself.

- **Geometry (single source):** `scripts/make-logo.py` — a 32×32 box, floor
  `M4 25 H28`, fall `M5 6 L16 25`, wedge `M5 6 L16 25 L5 25 Z` at 16% accent,
  landing dot `r 2.4` centered at `(16, 25)`. Strokes 3px, round caps.
- **Wordmark:** "Floorline" outlined from Instrument Serif Regular (SIL OFL,
  `assets/brand/`) at 26px em, baseline y=25, kerned via GPOS. No font
  dependency in the assets.
- **Assets:** `public/logo-mark.svg` (dark surfaces) ·
  `public/logo-mark-mono.svg` (single currentColor) · `public/logo-dark.svg` /
  `public/logo-light.svg` (full lockups) · `app/icon.svg` (favicon tile).
- **In-app:** `<Logo />` (`app/components/Logo.tsx`) — currentColor strokes +
  `var(--accent)`, so it adapts to light/dark automatically.
- **Regenerate:** `python3 scripts/make-logo.py`.
- **Rules:** never recolor the strokes; the accent appears only in the wedge
  and the landing dot; never place the dark lockup on light backgrounds —
  use `logo-light.svg`. Clear space = one floor-length (≈ x×0.9) on all sides.

## Direction

**Private banking, not crypto casino.** Floorline competes for trust the way Mercury and Stripe do: warm near-black surfaces, ivory text, a serif display face for headlines, monospaced tabular numerals for every figure, and exactly one semantic accent. Wealth products earn confidence through restraint — every element either communicates data, hierarchy, or action. Everything else is removed.

## Typography — the identity move

The serif / sans / mono triad is what makes this look designed:

| Face | Role | Where |
|---|---|---|
| **Instrument Serif** (400) | Display | Hero headlines, section titles, big statements. Never below 24px. |
| **Geist** | UI | Body, labels, buttons, nav. |
| **Geist Mono** | Data | Every number, price, address, hash, ticker. Always tabular. |

- Display headlines: `display` utility, tracking −1%, leading ~1.05.
- Eyebrow labels: 11px uppercase, 0.09em tracking, muted (`eyebrow` utility).
- Numbers: `num` utility — Geist Mono, tabular-nums, never jitter.

## Palette

### Surfaces (warm neutral — deliberately not blue-tinted)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#0E0E10` | Canvas |
| `--card` | `#141416` | Cards, panels |
| `--secondary` | `#1A1A1D` | Hover fills, secondary surfaces |
| `--input` | `#131315` | Inputs, wells |
| `--border` | `#26262A` | Hairline borders |
| `--border-strong` | `#3A3A41` | Hovered/focused borders |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--foreground` | `#EDEBE4` | Primary text (warm ivory) |
| `--muted-foreground` | `#8F8F96` | Secondary (≥4.5:1 on card) |
| `--faint` | `#63636A` | Disabled, decorative |

### Money semantics — the only color

| Token | Hex | Usage |
|---|---|---|
| `--up` / `--accent` | `#3DDC97` | Gains, buys, success |
| `--down` / `--destructive` | `#FF6369` | Losses, stops, errors |
| `--warning` | `#E8B45A` | Pending |
| `--up-soft` / `--down-soft` | 9% alpha | Tinted fills behind semantic text |

**Rule:** green and red carry financial meaning only. No gradients, no glow, no color for decoration.

## Buttons

- Primary: ivory fill (`#EDEBE4`), near-black text. Hover: pure white. Soft light shadow for lift.
- Buy: solid `--up` with dark green text. Sell: solid `--down` with white text.
- Secondary: `#1A1A1D` fill + hairline border. Ghost: text-only.
- Radius: **pill (full)** — aligned to the Obligor reference, 13 Nov 2026. Height 40px (sm 32px, lg 48px). Press = scale 0.97.

## Shape & depth

- Cards: `rounded-2xl` with the **engraved edge** (1px `--edge-light` highlight + offset groove shadows) on hero-level panels; hairline `--border` elsewhere. Inputs/buttons: pill. Badges: `rounded-md`.
- Depth = surface tone step + 1px hairline. Shadows only on overlays: `0 8px 24px rgba(0,0,0,.5)`.
- Hero product window uses a browser-chrome top bar with three dots — makes mockups read as "product", not "screenshot".

## Motion

- Enter: `fade-up` 450ms, stagger 75/100/150/200/300ms.
- Swap: `fade-in` 300ms. Ticker: 44s marquee.
- Nothing bounces, floats, pulses, or glows. `prefers-reduced-motion` disables all.

## Voice

- Confident, numeric, honest. "Own $10 of NVIDIA. In 60 seconds."
- Never: revolutionary, guaranteed, passive income, tamper-proof, AI-powered magic.
- Disclose plainly: not audited, non-US only, issuer risk, oracle staleness.

## Layout

- Landing: one centered column (max 1100px), section rhythm 96–128px, hairline `border-b` between sections.
- App: fixed desktop sidebar 240px + content max 1100px; mobile top bar + bottom dock.
- Data prefers tables/rows over card grids. Summary strips are single hairline cards with divide-x.

---
_Active as of 2026-11-14 · fourth generation · supersedes all earlier systems._
