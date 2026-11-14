# Floorline

<p align="center">
  <img src="public/logo.svg" alt="Floorline — drop anchor at your floor: the storm moves the surface, the anchor holds the seabed" width="300" />
</p>

> Deposit USDC from any of 30+ chains, set your own worst case, and own a self-managing tokenized position as a NEAR NFT.

Floorline splits every deposit at the contract level: a **reserve** (90% by default) moves to a separate escrow contract whose only door is the vault's settle path, and a **risk budget** is swapped into the risk asset. An automated de-risk rule sells the whole risk bucket if it falls 50% below what it cost — once, with no keeper discretion. At maturity the payout equals NAV: the reserve plus whatever the risk bucket kept. The worst case is the pre-committed risk budget — a number the depositor set, not one the market sets.

**Status.** The web product reads only real sources: live prices, quotes and deposit addresses from the NEAR Intents 1Click API; on-chain positions via NEAR JSON-RPC view calls; transaction history from the nearblocks indexer. The Rust vault + escrow contracts are deployed on **testnet** (`vault3.floorline-escrow.testnet`, `floorline-escrow.testnet`) and the full deposit → buy → de-risk → settle loop has been exercised on-chain with live market prices — see [`docs/ONCHAIN-TRAIL.md`](docs/ONCHAIN-TRAIL.md) for the transaction trail. Mainnet deployment is the same one command once a funded mainnet account exists.

This repository is the Next.js web app; the contracts, the keeper loop and the deployment scripts live under `contracts/` and `scripts/`.

## Verification steps

1. `npm run build && npm run start`, then `npm run smoke` — production checks against the real server: live prices, a real quote, honest deposit/attestation states, real on-chain error semantics, security headers, rate limiting.
2. Open `/` — read the pitch and drag the loss-limit preview; the worst case updates in dollars live.
3. Open `/create` — set a deposit and a loss limit; the worst case, risk budget and estimated units update before you send anything. Unverified equity routes are visibly marked.
4. Open `/vault/<position-id>` — the reserve, NAV, risk bucket, de-risk status, attestation state and the contract-event log, all read from the chain.
5. `npx tsc --noEmit` — the whole app type-checks clean.
6. `npm test` — the unit suite on the formula core passes.
7. `make test-rust` — contract unit + invariant tests, including the deliberately broken escrow build the invariant suite catches.

## What it is NOT

Not a brokerage. Not a custodial exchange. Not a perp DEX. Not a lending protocol. Not a yield farm. Not an "AI trading agent". No leverage — there is no liquidation because there is no borrowing. Not a stop-loss product (a stop on thin equity liquidity gaps cannot be promised; the escrowed reserve is the guarantee instead). Not investment advice. Not available to US persons.

## Architecture

```
 USER (any of 30+ chains)
      │ USDC via NEAR Intents (1Click), recipient = vault
      ▼
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ vault (Rust, near-sdk)                                                       │
 │  deposit(): F ──ft_transfer──► escrow (only settle/recover can release it)    │
 │              R stays in vault; the keeper swaps R → risk asset                │
 │  de-risk(): single-shot rule sells the whole bucket past the trigger          │
 │  settle(): payout = NAV; Escrow.release(F); burn the NFT                      │
 └───────┬───────────────────────────────────────────────────────────────────────┘
         │ events / view calls
         ▼
 ┌──────────────────────┐      ┌──────────────────────────────┐
 │ keeper loop          │      │ Next.js app (this repo)      │
 │ (scripts/keeper.mjs) │ ───► │ /create · /vault/[id] · /api │
 └──────────────────────┘      └──────────────────────────────┘
```

- **`contracts/vault`** — NEP-141 receiver + NEP-171 vault logic; positions are NFTs bound to their owner.
- **`contracts/escrow`** — the separate reserve contract; `release` is gated on `predecessor == vault` and a terminal position state.
- **`contracts/oracle`** — quote-signature verification; every keeper price must be ed25519-signed on-chain.
- **`app/lib/`** — the same formulas in TypeScript (display-only f64; on-chain math is u128 with checked ops).

## Getting started

```bash
npm ci                 # install
npm run dev            # develop
make setup             # + build the Rust contracts (wasm target)
make test              # TypeScript + Rust test suites
npm run check:copy     # copy hygiene (banned marketing phrases, asset-name rule)
npm run build && npm run start
npm run smoke          # production smoke suite against the running server
```

Environment: copy `.env.example` to `.env.local`. Every variable is documented there; nothing is required for read-only surfaces — the deposit-address flow activates when `ONE_CLICK_API_KEY` is set.

## API reference

All endpoints are Next.js Route Handlers under `/api`. Consistent error shape: `{ error: string, ...context }` with proper HTTP status codes. Rate limited per IP (429 + `Retry-After`). Correlation id: send `x-request-id`, or read it from the JSON logs.

| Endpoint | Method | Source | Notes |
|---|---|---|---|
| `/api/healthz` | GET | probes NEAR RPC + 1Click | 5s timeouts; wire your uptime monitor here |
| `/api/prices` | GET | 1Click `/v0/tokens` | live prices; filtered to configured assets |
| `/api/quote` | POST | 1Click `/v0/quote` (dry) | `{amountMicro, destinationAsset?}`; validated |
| `/api/deposit` | POST | 1Click reusable-address flow | needs `ONE_CLICK_API_KEY`; returns the real per-chain address set or the upstream rejection + remediation |
| `/api/deposit/status` | GET | 1Click `/v0/status` | `?address=`; live status enum |
| `/api/agent/policy` | POST | deterministic parser (+ optional LLM leg) | `{mandate}` → `{policy}`; clamped to contract ranges — see [`docs/AGENT_POLICY.md`](docs/AGENT_POLICY.md) |
| `/api/agent/deposit` | POST | — | `{policy, amount, account}` → the unsigned on-chain instruction; every field re-validated server-side |
| `/api/vault/positions` | GET | NEAR JSON-RPC `positions_of` | `?account=`; real "not deployed" state |
| `/api/vault/position/[id]` | GET | NEAR JSON-RPC `get_position` | numeric NEP-171 token id |
| `/api/v1/equity-price` | GET | Yahoo Finance | live reference price for the equity wedge |
| `/api/v1/rebalance` | POST | keeper | one keeper action, idempotent per epoch |
| `/api/v1/attestation/:id` | GET | — | honestly `verified: false` until the TEE flow is wired |
| `/api/activity` | GET | nearblocks indexer | `?account=`; real tx history |

## Runbook

**Health.** `GET /api/healthz` returns per-dependency ok/latency for NEAR RPC and 1Click. Alert when `dependencies[].ok = false` for 3 consecutive minutes.

**Logs.** Every route logs structured JSON with a correlation id (`x-request-id` honoured).

**Deploy (Vercel).** Set the env vars from `.env.example` in the project settings; `vercel deploy --prod`. Rollback: `vercel rollback <deployment>` — under 1 minute.

**Deploy (self-host).** `npm run build && npm run start` (or `docker compose up`). Rollback: redeploy the previous git tag.

**Database (Supabase in 3 steps).** The deposit and policy stores auto-dispatch: with `DATABASE_URL` set they persist to Postgres/Supabase; without it, a durable local JSON store (same interface, zero config).
1. Create a project at [supabase.com](https://supabase.com) → Settings → Database → Connection string → URI (use the **Connection pooling** string for serverless deploys).
2. Paste it as `DATABASE_URL` in your env (`postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`).
3. Restart — the tables auto-migrate on first use. Nothing else changes; the reconcile sweep and every route read/write through the same interface.

**Contracts.** `scripts/deploy-contracts.sh` deploys vault + escrow; testnet is live today, mainnet is the same command with a funded account.

**Known limits (honest).**
- Contracts are live on **testnet**. Mainnet costs are not reimbursed by anyone — it is a funded-account decision.
- Rate limiting is per-process in-memory. Multi-instance production needs a shared store (swap `app/lib/rate-limit.ts`'s bucket for Redis — one file).
- The TEE attestation is honestly pending (`verified: false`) until `NEAR_AI_API_KEY` is set and the verify flow is wired. Badges are never faked.
- The equity route is a **documented roadmap item**: tokenized equities are not yet on the 1Click token list (verified 12–13 Nov 2026). The demo runs the verified fallback asset with the identical mechanism.

## Limitations

- **Not audited.** The escrow invariant suite and its deliberately broken build (`--features break_escrow`) are the pre-audit answer; see the threat model. Do not point real value at these contracts before a third-party audit.
- **Equity route pending.** See above — disclosed, not implied.
- **No fixtures, no simulated data.** The frontend reads only real sources; pages show the chain's real error state and real empty states.

Full lists: [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) · [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) · [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md).

## Security

- Reserve custody is enforced by a **separate escrow contract**: `release` reverts for any caller except the vault, and only in a terminal position state. The invariant suite runs randomized operation sequences after every action, and a `break_escrow` feature build is caught by the tests (see [`docs/MUTATION.md`](docs/MUTATION.md)).
- Every keeper price is **ed25519-verified on-chain**; unsigned, forged, replayed or stale quotes revert.
- Payout failure restores the position (no stranded claims); settlement is idempotent; de-risk is single-shot.
- Threat model with residual risks: [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Decision log

Every ambiguity and its resolution lives in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Tech stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript, Recharts, Framer Motion
- **Type:** Instrument Serif (display) + Geist (UI) + Geist Mono (tabular data) via `next/font`
- **Design system:** [`brand.md`](brand.md) — warm near-black surfaces, ivory text, one semantic accent
- **Contracts:** Rust, `near-sdk`; NEP-141 + NEP-171
- **Rails:** NEAR Intents (1Click) · NEAR Chain Signatures · nearblocks indexer
