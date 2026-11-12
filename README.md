# OneShare

> One tap, any chain, $10 of NVIDIA — a stock that manages itself.

OneShare lets anyone buy a real tokenized US equity (e.g. NVDAx, a 1:1 custodied xStock on Solana) in under 60 seconds by paying with any token on any chain, and receive it as a NEAR NEP-171 "position NFT" that carries its own risk policy: stop-loss, take-profit and DCA rules enforced onchain, custody via NEAR Chain Signatures, and a collateralizable object.

Built for the NEAR Hackathon 2026.

## What it is

- **Cross-chain funding:** Pay with USDC on Base (or any NEAR Intent route) and land Solana USDC in one tap.
- **Self-custody via Chain Signatures:** The Solana address is derived from your NEAR account by the MPC network. We never hold a key.
- **Position NFT:** The position itself is a NEP-171 NFT. Whoever holds the NFT controls the underlying Solana account.
- **Policy engine:** Set stop-loss, take-profit, and DCA rules. A bonded keeper can only act inside your bounds, with an onchain audit log.

## What it is NOT

Not a brokerage, not a custodial exchange, not a staking product, not a memecoin, not an AI-trading-signal bot, not hardware, not a yield farm, not available to US persons.

## Tech stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript
- **Fonts:** Geist + Geist Mono via `next/font`
- **Charts:** Recharts (portfolio + simulator)
- **Icons:** Lucide React
- **Chain side:** NEAR (`near-sdk-rs`), Solana (`@solana/web3.js`), Jupiter, 1Click API

## Screens

| Route | What |
|---|---|
| `/` | Marketing landing: hero, live ticker, how-it-works, features, position-NFT showcase, stats, CTA |
| `/dashboard` | Portfolio value, equity chart with range tabs, active positions, recent activity |
| `/buy` | Quote → deposit → swap → mint flow with fee breakdown and progress |
| `/positions` | List with summary bar and premium position cards |
| `/positions/[id]` | PnL, status timeline, custody panel, policy editor, audit log |
| `/sim` | Deterministic policy backtester on 2025–26 NVDA daily closes |
| `/explain` | TEE-attested explanation UI with cached fallback |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/buy`.

## Build

```bash
npm run build
```

## Project structure

```
app/
  (app)/          # Authenticated app shell
    buy/page.tsx
    positions/
    sim/page.tsx
    explain/page.tsx
  components/     # Reusable UI kit + domain components
  lib/            # Types, fixtures, formatting utilities
brand.md          # Visual identity source of truth
```

## Limitations

- This repository contains the frontend prototype. Contract, keeper, and adapter code are in separate modules.
- Smart contracts are not audited.
- Custody in the hackathon build relies on NEAR Chain Signatures; residual risks include issuer solvency, oracle staleness, and MPC trust assumptions.
- Non-US only, per xStocks terms. We do not give investment advice.

## License

MIT
