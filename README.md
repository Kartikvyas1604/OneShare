# Floorline

**Deposit from any of 30+ chains, set the worst case, own a self-managing tokenized position as a NEAR NFT.**

The reserve sits in a **separate escrow contract whose only door is the vault's settle path**. The risk bucket is capped at the share you chose, the de-risk rule is a single-shot formula the contract enforces, and the position is a transferable NEP-171 NFT. We take zero leverage — there is no liquidation because there is no borrowing.

Built for the agent economy: an autonomous treasury can write its own loss limit and the escrow contract enforces it — prompt guardrails are advisory, custody is not ([agent policy](docs/AGENT_POLICY.md)).

- **Contracts (testnet, live):** vault `vault3.floorline-escrow.testnet` · escrow `floorline-escrow.testnet`
- **Risk asset (testnet stand-in):** `nvda.floorline-escrow.testnet` — a real NEP-141 so the loop executes end-to-end; when tokenized equities list on 1Click, the vault's `risk_asset_id` points at them with **zero contract change**
- **Quote asset:** `wrap.testnet` (24 dec) · deposits accept a per-position loss limit (`msg = "deposit:<ratio>"`, contract-clamped to [5000, 9800])

## Do X → see Y (verification steps for judges)

1. Open `/` → read the pitch and drag the **loss-limit preview** slider — the worst case updates in dollars live.
2. Open `/create` → set a deposit and a loss limit → the **worst case, risk budget, and estimated units** update before you send anything; unverified equity routes are visibly gated with live market quotes.
3. Connect a wallet on `/create` → deposit → the vault splits 90/10 on-chain and **escrows the floor at `floorline-escrow.testnet`** (tx trail: [docs/ONCHAIN-TRAIL.md](docs/ONCHAIN-TRAIL.md)).
4. Open `/vault/<your-account>` → the position NFT: floor, NAV, risk bucket, de-risk meter, on-chain state.
5. Open `/crash` → drag the shock to −45% → **three arms** with median terminal, worst-1% in dollars, and max drawdown — computed at runtime by the deterministic engine, seed 20261112.
6. Run `make test-rust` → 19 Rust tests pass, **including the invariant fuzz (2,000 sequences, I1–I6 checked after every operation)**.
7. Run `cd contracts && cargo test -p floorline-escrow --features break_escrow` → **the test FAILS** — that failure is the proof the escrow gate has teeth (spec K-5). Without the flag it passes.
8. Run `node scripts/keeper.mjs --once` → the keeper **polls positions, fetches live prices, signs with the oracle key, and records buys/de-risks on-chain with no human** (live tx in the trail).
9. Run `node scripts/agent-jailbreak.mjs` → the agent-policy clamp output **and** the contract's independent on-chain rejection of `deposit:10000` (`ErrStepExceeded`) — evidence in `artifacts/agent-jailbreak.json`.
10. Run `npm test` → 48 TypeScript tests: formula core, crash engine, agent policy golden cases, **and the TS↔Python sim parity (F-16)**.
11. Run `make sim` → regenerates `artifacts/sim-baseline.json` (10,000 paths, seed 20261112) — numbers below.
12. Run `node scripts/check-copy.mjs` → banned-words + asset-name rules pass.
13. `npm run build && npm run start`, then `node scripts/smoke.mjs http://localhost:3000` → 15 production checks against the real server.

## The Monte-Carlo (deterministic, seed 20261112, 10,000 paths, −45% shock)

| Arm | Median loss | Worst 1% |
|---|---|---|
| Naive · 100% exposed | **−44.56%** | worse |
| Static floor · no de-risk | **−4.46%** | bounded |
| Floorline · de-risk armed | **−5.17%** | bounded |

Regenerate: `make sim`. Parity with the web engine is asserted in CI (±0.5 pp, F-16). Raw construction: median-neutral GBM, σ = 0.80 annualized, one instantaneous shock at step 30/90, three arms share the same paths.

## Architecture

```
user (any chain) ──1Click deposit──▶ vault3.floorline-escrow.testnet
                                        │ ft_on_transfer: split D → F + R (per-deposit ratio, F-22)
                                        │ I1: F ──ft_transfer_call──▶ floorline-escrow.testnet (locked per position)
                                        │ position = NEP-171 NFT (token_id == position_id)
keeper (scripts/keeper.mjs — automated, oracle-signed quotes)
                                        │ record_buy (slippage, freshness, T-02 signature, I2 cap)
                                        │ record_de_risk (formula 6, single-shot I6)
owner ─────────────────────────────────│ settle / exit_early → escrow.release (state cross-check) → payout
```

**Oracle trust model (T-02):** every price quote must carry an **ed25519 signature over `floorline-quote:{position_id}:{price_1e18}:{ts}`** from the configured oracle key (`env::ed25519_verify` on-chain). A forged, replayed, or unsigned quote reverts before any state change — proven live (unsigned → `ErrBadQuoteSignature`, forged → same, signed → accepted; trail in `docs/ONCHAIN-TRAIL.md`).

## Limitations (honest — full list in [docs/LIMITATIONS.md](docs/LIMITATIONS.md))

- **Tokenized equities: NOT live (G-2 closed).** 1Click lists 231 tokens, zero equities (verified 12–13 Nov 2026); `nvdaon.near` on mainnet is an empty account. The demo runs a real NEP-141 stand-in on testnet so every contract path executes with real prices from Yahoo Finance + 1Click. The wedge is a parameter, not a promise.

**Roadmap — tokenized equities.** The vault's risk asset is a parameter. When Ondo stocks (live on near.com since 22 Sep 2026) appear in the 1Click token list — access was announced 31 Oct 2026 — `assets.json` gains `nep141:<nvdaon-asset-id>` and the same vault, the same escrow, and the same de-risk rule hold tokenized equities with zero contract change. Verified blocker today: the 1Click API lists 231 tokens, none tokenized; `nvdaon.near` on mainnet is an empty account.

- **Not audited.** The invariant suites (2,000-sequence fuzz + the `break_escrow` failing build) are this build's answer; a formal third-party audit is the production answer before the contracts hold real value.
- **Testnet key custody.** The testnet oracle seed and the demo signer key live in `.env.local`/keychain (gitignored). Production needs KMS/HSM custody and a funded mainnet account.
- **TEE attestation deferred.** The de-risk rule runs as a local deterministic rule (formula 6); the attestation surface returns honest `pending` state and was removed from the demo per the spec's hour-20 deadline.
- **Contract size.** The vault wasm is 256 KB after `wasm-opt -Oz` (spec target 160 KB) — a near-sdk 5 baseline cost, disclosed rather than hidden.

## v2 — the paired-floor market

v1 is single-sided: every depositor funds their own floor with their own risk budget. v2 pairs two depositors with complementary loss limits: the conservative side's reserve funds the floor, the aggressive side's risk budget harvests everything above it and absorbs everything below. Each pair is zero-sum, spot-collateralized, and needs no liquidation engine and no oracle-dependent margin call — a perpetual made of paired loss limits, which is exactly the "never-liquidated" primitive on Illia's wishlist, generalized into a market. Protocol fee: 10 bps per pairing. **Not built in this event**; the escrow's `release` gating is the primitive it composes with.

```
   conservative agent ── floor F, wants ≥ F back ──┐
                                                   ├─ PAIR ── zero-sum · no liquidation engine
   aggressive agent ──── risk budget R ────────────┘
        reserve (escrow, I1) ── owned by the pair ── settle splits NAV:
              F → conservative · surplus → aggressive · shortfall → aggressive
```

## API reference (Next Route Handlers — the keeper backend)

| Route | What it does | Real source |
|---|---|---|
| `GET /api/healthz` | version + dependency checks | live RPC + adapters |
| `GET /api/prices` | quote-asset prices | 1Click `/v0/tokens` |
| `GET /api/v1/equity-price` | NVDA equity quote | Yahoo Finance (30 s cache) |
| `GET /api/quote` | real 1Click dry quote (JWT-aware) | 1Click `/v0/quote` |
| `POST /api/deposit` · `GET /api/deposit/status` | deposit address + status | 1Click deposit API |
| `GET /api/vault/positions` · `/api/vault/[id]` | on-chain positions | NEAR JSON-RPC view calls |
| `GET /api/tokens` | 231 live assets | 1Click `/v0/tokens` |
| `GET /api/activity` | on-chain events | nearblocks |
| `POST /api/v1/crash-sim` | deterministic three-arm sim | runtime engine (seed) |
| `GET /api/v1/attestation/:id` | honest `pending` state | — |
| `POST /api/agent/policy` | mandate → clamped policy | parser (+ optional NEAR AI) |
| `POST /api/agent/deposit` | policy → on-chain instruction | server-side re-validation |
| `POST /api/agent/jailbreak` | clamp + contract decision | — |

## Runbook

```
npm ci && npm run build && npm run start        # app on :3000
node scripts/keeper.mjs                          # automated keeper loop
cd contracts && cargo test                       # 19 Rust tests
make sim                                         # regenerate the baseline
```

Deployment, env vars, and rollback: `.env.example`, `Dockerfile` (non-root, HEALTHCHECK), CI on every push.

## Decision log

Every ambiguity and its resolution: [`docs/DECISIONS.md`](docs/DECISIONS.md). Security model: [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md). The demo's raw on-chain evidence: [`docs/ONCHAIN-TRAIL.md`](docs/ONCHAIN-TRAIL.md).

## Tech stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript, Recharts
- **Contracts:** near-sdk 5, NEP-141 receiver + NEP-171, ed25519 oracle verification
- **Keeper:** Next Route Handlers + `scripts/keeper.mjs` (oracle-signed, automated)
- **Sponsors:** NEAR Intents (1Click) · NEAR Chain Signatures · NEP-171 · NEAR AI Cloud

## Sources

- Judged-wishlist alignment (R6): [Illia Polosukhin's "never-liquidated" post](https://x.com/ilblackdragon/status/2118027843980366222)
- [NEAR Intents / 1Click docs](https://docs.near-intents.org) · [NEAR Chain Signatures](https://docs.near.org/chain-abstraction/chain-signatures)
