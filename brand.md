# Brand — OneShare

> One tap, any chain, $10 of NVIDIA — a stock that manages itself.

## Status

Active. This file is the source of truth for all color, typography, spacing, voice, and motion decisions in the OneShare web app.

## Positioning

- **Category:** Cross-chain tokenized equities + self-managing positions.
- **Feeling:** Premium, calm, institutional-trustful but mobile-native.
- **Personality:** Confident, precise, quietly futuristic. No hype, no casino vibes.
- **Motion:** Fast, responsive, never decorative. Motion explains state changes.

## Palette

### Primary

| Token | Hex | Usage |
|---|---|---|
| `--brand-50` | `#EEF4FF` | Very light backgrounds, badges |
| `--brand-100` | `#D9E6FF` | Hover states on light |
| `--brand-200` | `#B6D0FF` | Focus rings, highlights |
| `--brand-300` | `#84B1FF` | Links, secondary accents |
| `--brand-400` | `#4F8CFF` | Interactive emphasis |
| `--brand-500` | `#2563FF` | **Primary brand color** — CTAs, key data |
| `--brand-600` | `#154AE0` | Primary hover / pressed |
| `--brand-700` | `#103AB6` | Strong emphasis backgrounds |
| `--brand-800` | `#12338F` | Surfaces |
| `--brand-900` | `#142E6E` | Deep surfaces |
| `--brand-950` | `#0F1C3D` | Darkest brand layer |

### Neutral scale (cool gray)

| Token | Hex | Usage |
|---|---|---|
| `--neutral-0` | `#FFFFFF` | White |
| `--neutral-50` | `#F8FAFC` | Card backgrounds (light mode) |
| `--neutral-100` | `#F1F5F9` | Subtle fills |
| `--neutral-200` | `#E2E8F0` | Borders, dividers |
| `--neutral-300` | `#CBD5E1` | Disabled, placeholders |
| `--neutral-400` | `#94A3B8` | Muted text |
| `--neutral-500` | `#64748B` | Secondary text |
| `--neutral-600` | `#475569` | Body text light |
| `--neutral-700` | `#334155` | Strong text light |
| `--neutral-800` | `#1E293B` | Headings light |
| `--neutral-900` | `#0F172A` | Near black |
| `--neutral-950` | `#020617` | Deepest dark background |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#10B981` | Positive PnL, success states |
| `--success-soft` | `#D1FAE5` | Success backgrounds |
| `--warning` | `#F59E0B` | Warnings, pending |
| `--warning-soft` | `#FEF3C7` | Warning backgrounds |
| `--destructive` | `#EF4444` | Negative PnL, errors, stop-loss triggers |
| `--destructive-soft` | `#FEE2E2` | Error backgrounds |
| `--info` | `--brand-500` | Information |

### Dark mode surfaces

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#020617` | App background |
| `--bg-elevated` | `#0B1221` | Cards, sheets |
| `--bg-sunken` | `#01040F` | Input backgrounds, deepest wells |
| `--border-subtle` | `#1E293B` | Borders in dark |
| `--border-strong` | `#334155` | Focused borders |

## Typography

- **Sans:** Geist (already loaded) — use for UI, headings, body.
- **Mono:** Geist Mono (already loaded) — use exclusively for numbers, addresses, hashes, code.
- **Scale:**
  - `display-xl`: 48/52, tracking-tight, font-semibold
  - `display-lg`: 36/40, tracking-tight, font-semibold
  - `display-md`: 28/32, tracking-tight, font-semibold
  - `heading-lg`: 24/28, font-semibold
  - `heading-md`: 20/24, font-semibold
  - `heading-sm`: 16/20, font-semibold
  - `body-lg`: 16/24
  - `body`: 14/20
  - `body-sm`: 13/18
  - `caption`: 12/16
  - `label`: 11/12, uppercase, tracking-wide, font-medium

## Spacing

- Page gutter: `px-4 md:px-6 lg:px-8`
- Max content width: `max-w-md` (mobile-first), `max-w-2xl` for wide screens
- Section gaps: `gap-6` mobile, `gap-8` desktop
- Card internal padding: `p-5` mobile, `p-6` desktop
- Input height: 48 px (`h-12`)
- Button height: 48 px primary, 40 px secondary

## Radius

- Buttons: `rounded-xl` (16 px)
- Inputs: `rounded-xl`
- Cards: `rounded-2xl` (20 px)
- Pills/badges: `rounded-full`
- Small chips: `rounded-lg`

## Shadows (dark mode)

- `shadow-card`: `0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)`
- `shadow-float`: `0 4px 20px rgba(0,0,0,0.4)`
- `shadow-glow-brand`: `0 0 24px rgba(37,99,255,0.18)`

## Motion

- Micro: 100 ms (hover, focus)
- Short: 150 ms (tooltips, dropdowns)
- Medium: 200–250 ms (sheets, dialogs)
- Long: 300 ms (page transitions)
- Easing enter: `cubic-bezier(0,0,0.2,1)`
- Easing exit: `cubic-bezier(0.4,0,1,1)`
- Easing move: `cubic-bezier(0.4,0,0.2,1)`
- Respect `prefers-reduced-motion`.

## Voice

- Active voice, specific, no fluff.
- Say: “Own $10 of NVIDIA in 60 seconds.”
- Don’t say: “Revolutionary,” “game-changing,” “passive income,” “guaranteed.”
- Error copy explains what happened and what to do next.
- Empty states lead with a clear next action.

## Logo / wordmark

Text-only wordmark: **OneShare** in Geist, semibold, tracking-tight. No icon required for MVP; a simple stacked-square mark may be added later.

## Application

All colors, spacing, radius, and motion values are implemented as CSS custom properties in `app/globals.css` and consumed via Tailwind `@theme inline`. No raw hex values in components except where documented above.

---
_Deferred: none. Brand system active as of 2026-11-12._
