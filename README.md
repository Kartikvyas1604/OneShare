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
8. Run `npm test` → 29 unit tests on the formula core and the crash engine pass.
9. Run `npm run build && npm run start`, then `npm run smoke` → **15 production checks** pass against the real server: live prices, real quote, deterministic crash-sim byte-identity, honest deposit/attestation states, real on-chain error semantics, security headers, rate limiting.
10. Open `/legal` → the ToS + privacy policy with the disclosure set (non-US, not audited, third-party rails).

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

## API reference (Next Route Handlers — the keeper backend)

All endpoints are Next.js Route Handlers under `/api` (spec §6.3's keeper API, versioned under `/api/v1` where contract-stable). Consistent error shape: `{ error: string, ...context }` with proper HTTP status codes. Rate limited per IP (quote 30/min, crash-sim 10/min; 429 + `Retry-After`). Correlation id: send `x-request-id`, or read it from the JSON logs.

| Endpoint | Method | Real source | Notes |
|---|---|---|---|
| `/api/healthz` | GET | probes NEAR RPC + 1Click | 5s timeouts; wire your uptime monitor here |
| `/api/prices` | GET | 1Click `/v0/tokens` | live prices; filtered to configured assets |
| `/api/quote` | POST | 1Click `/v0/quote` (dry) | `{amountMicro, destinationAsset?}`; validated |
| `/api/deposit` | POST | 1Click reusable-address flow | needs `ONE_CLICK_API_KEY` (G-4); returns the real per-chain address set or the upstream rejection + remediation |
| `/api/deposit/status` | GET | 1Click `/v0/status` | `?address=`; live status enum |
| `/api/vault/positions` | GET | NEAR JSON-RPC `positions_of` | `?account=`; real "not deployed" state |
| `/api/vault/position/[id]` | GET | NEAR JSON-RPC `get_position` | numeric NEP-171 token id |
| `/api/activity` | GET | nearblocks indexer | `?account=`; real tx history |
| `/api/v1/crash-sim` | POST | deterministic engine | `{shock_pct, seed?}` → losses + `path[]` (F-16) |
| `/api/v1/attestation/:id` | GET | — until TEE wired | honestly `verified: false` |

## Runbook

**Health.** `GET /api/healthz` returns per-dependency ok/latency for NEAR RPC and 1Click. Wire an external uptime monitor to `/api/healthz` and alert when `dependencies[].ok = false` for 3 consecutive minutes.

**Logs.** Every route logs structured JSON with a correlation id (`x-request-id` honoured). In production: `docker logs -f floorline | jq 'select(.level=="error")'`.

**Deploy (Vercel).** Set the env vars from `.env.example` in the project settings; `vercel deploy --prod`. Rollback: `vercel rollback <deployment>` — under 1 minute.

**Deploy (self-host).** `npm run build && npm run start` (or `docker compose up` with a mounted volume for `DEPOSITS_STORE_PATH`). Rollback: redeploy the previous git tag; the deposit store is append-mostly and forward-compatible.

**Known limits (honest).**
- The vault contract is not deployed on mainnet yet: position reads surface the chain's real error ("account does not exist on NEAR mainnet yet") and real empty states — nothing is simulated.
- Deposit-address creation requires the 1Click partner key (`ONE_CLICK_API_KEY`, spec G-4). Without it the endpoint returns the upstream rejection plus the remediation; no address is ever fabricated.
- Rate limiting is per-process in-memory. Multi-instance production needs a shared store (swap `app/lib/rate-limit.ts`'s bucket for Redis — one file).
- The TEE attestation is honestly pending (`verified: false`) until `NEAR_AI_API_KEY` is set and the verify flow is wired.

## Limitations (honest)

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
