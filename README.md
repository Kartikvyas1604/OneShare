# Floorline

> Deposit USDC from any of 30+ chains, pick a loss limit, and own a self-managing slice of NVIDIA as a NEAR NFT.

Floorline splits every deposit at the contract level: a **reserve** (90% by default) moves to a separate escrow contract whose only door is the vault's settle path, and a **risk budget** is swapped into the risk asset. An automated de-risk rule sells the whole risk bucket if it falls 50% below what it cost — once, with no keeper discretion. At maturity the payout equals NAV: the reserve plus whatever the risk bucket kept. The worst case is the pre-committed risk budget — a number the depositor set, not one the market sets.

Built for [NEAR Hackathon 2026](https://nearhackathon.com/) (deadline 14 Nov 2026). This repo is the Next.js web app; the Rust vault + escrow contracts, the Fastify keeper, and the deterministic Python simulation live in the combined build spec at [`agent/Agent.md`](agent/Agent.md).

## Do X → see Y (verification steps for judges)

1. Open `/` → read the pitch and drag the **loss-limit preview** slider — the worst case updates in dollars live.
2. Open `/create` → set a deposit and a loss limit → the **worst case, risk budget, and estimated units** update before you send anything; unverified equity routes are visibly gated.
3. Open `/vault/0x8f3a1c42e7b8d05a6c1f24b8e3d9f0a7` → see the **reserve escrowed at `floor.vault-demo.near`**, the NAV, the risk bucket, the −50% de-risk meter, the TEE attestation badge, and the contract-event log.
4. Open `/vault/0x2b9e6f41d3c78a5f0e4b2c9d7a1f8e3b` → a position whose **de-risk already fired**: realised proceeds locked, single-shot rule exhausted.
5. Open `/crash` → drag the shock to −45% → **three arms** (naive red, static floor amber, Floorline green) with median terminal, worst-1% in dollars, and max drawdown; "Replay recorded run" reproduces the recorded result exactly (seed 20261112).
6. Run `npm run check:copy` → the banned-words rule (§0.5 of the spec) passes with zero matches.
7. Run `npx tsc --noEmit` → the whole app type-checks clean.

## What it is NOT

Not a brokerage. Not a custodial exchange. Not a perp DEX. Not a lending protocol. Not a yield farm. Not an "AI trading agent". No leverage in v1 — there is no liquidation because there is no borrowing. Not a stop-loss product (a stop on thin equity liquidity gaps cannot be promised; the escrowed reserve is the guarantee instead). Not investment advice. Not available to US persons.

## Screens (spec §6.5)

| Route | Contents | States |
|---|---|---|
| `/` | Pitch, loss-limit slider preview, embedded demo video, repo link | loading / loaded / video-failed |
| `/create` | Risk asset, loss limit (50–98%, step 1%), term, live worst case | idle / quoting / insufficient / submitting / success |
| `/vault/[id]` | Position NFT card, reserve, NAV, risk bucket, de-risk status + trigger, attestation badge, Settle / Exit early | loading / no-wallet / empty / live / degraded |
| `/crash` | Shock slider −90…+90%, three arms, terminal $ and max drawdown, replay recorded run | idle / simulating / error → cached result |

Old routes redirect: `/buy → /create`, `/sim → /crash`, `/positions/[id] → /vault/[id]`.

## Honest limitations

- **Equity route gated (G-2).** Tokenized equities were **not present** on 1Click's 230-token list (verified 12 Nov 2026). The demo runs the verified fallback asset (`nep141:wrap.near`) with the identical mechanism; the equity wedge stays a documented roadmap item.
- **TEE attestation pending (R3).** Until the NEAR AI Cloud attestation flow verifies end-to-end, the local rule (formula 6 only) executes and every badge says pending. Badges are never faked.
- **No fixtures, no simulated data.** The frontend reads only real sources: live prices, quotes, and deposit addresses from the 1Click API (verified 12–13 Nov 2026); on-chain positions via NEAR JSON-RPC view calls (`positions_of`, `get_position` per §6.2) against `VAULT_CONTRACT_ID`; transaction history from the nearblocks indexer. Until the vault contract is deployed, pages show the chain's real error state ("account does not exist on NEAR mainnet yet") and real empty states. Crash-simulator numbers are computed at runtime by the deterministic engine (seed 20261112) — not stored results.
- **Not audited.** The escrow invariant and its deliberately broken build (`--features break_escrow`) are the production answer; see the spec's threat model (T-01).

## Decision log

Every ambiguity and its resolution lives in [`docs/DECISIONS.md`](docs/DECISIONS.md) per spec §0.4.

## Tech stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript, Recharts
- **Type:** Instrument Serif (display) + Geist (UI) + Geist Mono (tabular data) via `next/font`
- **Design system:** [`brand.md`](brand.md) — warm near-black surfaces, ivory text, one semantic accent (gains green / losses red)
- **Sponsors:** NEAR Intents (1Click) · NEAR Chain Signatures · NEP-171 · NEAR AI Cloud (TEE)

## Sources

- Judged-wishlist alignment (R6): [Illia Polosukhin's "never-liquidated" post](https://x.com/ilblackdragon/status/2118027843980366222)
- [NEAR Intents / 1Click docs](https://docs.near-intents.org) · [NEAR AI Cloud verification](https://docs.near.ai/cloud/verification) · [NEAR Chain Signatures](https://docs.near.org/chain-abstraction/chain-signatures)
