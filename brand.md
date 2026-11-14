# Brand — Floorline

> Set your own worst case. The floor holds.

## Logo — the bank facade, monochrome

A classical bank building — pediment, three columns, two base steps — with
the entablature beam as the product's namesake: **the floor line your money
stands on.** The logo is strictly monochrome. The brand accent never
appears in it: in this product, color means money semantics (gains/losses),
and a logo is not a money state.

- **Geometry (single source):** `scripts/make-logo.py` — a 64×64 box:
  pediment `M32 6 L56 19 H8 Z`; beam `rect (9,22,46,5.5) rx 1.6`; three
  columns `7×17 rx 2.4` at x 14 / 28.5 / 43; steps `(10,51,44,5)` and
  `(6,58,52,5)` rx 2.
- **Wordmark:** "Floorline" outlined from Geist SemiBold (SIL OFL,
  `assets/brand/Geist[wght].ttf`), 30px em, GPOS-kerned, centered below the
  emblem. No font dependency in the shipped assets.
- **Assets:** `public/logo.svg` — official lockup, ivory on the near-black
  canvas (matches the product UI theme) · `public/logo-light.svg` — ink on
  white, for print/light surfaces · `public/logo-emblem.svg` — ivory
  emblem, transparent · `app/icon.svg` + `app/favicon.ico` — near-black
  rounded tile, ivory facade.
- **In-app:** `<Logo />` (`app/components/Logo.tsx`) — pure `currentColor`,
  so it inherits the surface automatically. No accent, ever.
- **Regenerate:** `python3 scripts/make-logo.py` (then re-render
  `app/favicon.ico` per the script's docstring).
- **Rules:** one color per surface — ivory on dark, ink on white; never mix
  the accent into the logo; clear space = one column height (17 units) on
  all sides.

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
