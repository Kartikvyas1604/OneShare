# REQUIREMENTS — Floorline product requirements

Internal traceability doc. Every item has a stable ID used in `docs/AUDIT.md`.

## 1. Gates

| ID | Requirement | Acceptance |
|---|---|---|
| G-1 | Risk asset quotable on 1Click | dry quote returns amountOut + minAmountOut |
| G-2 | Equity venue route | verified not available yet (12–13 Nov) — fallback ships, gap disclosed |
| G-3 | Two-contract escrow | foreign `release` reverts; vault path succeeds in terminal state |
| G-4 | Confidential execution (JWT) | `CONFIDENTIALITY=public` until the JWT is configured; no confidentiality claims in copy |
| G-5 | Agent policy clamps to contract ranges | policy parser golden cases return clamped values |
| G-6 | TEE attestation | deferred — the attestation surface returns honest `pending` |

## 2. Engineering rules

| ID | Requirement |
|---|---|
| R-0.1 | Single source of truth for constants (`app/lib/floorline.ts` ↔ `contracts/vault/src/types.rs`) |
| R-0.2 | Never invent external strings — live calls saved in `artifacts/verified/` |
| R-0.3 | Adapters for everything external; no external API calls from contract code or React components |
| R-0.4 | Ambiguity → simplest correct option + a `docs/DECISIONS.md` line |
| R-0.5 | Copy hygiene: banned marketing phrases grep = 0; asset names only in factual/roadmap context |
| R-0.6 | No placeholders — every parameter has a default and a unit |

## 3. Product semantics

| ID | Requirement |
|---|---|
| P-4.1 | VaultConfig fields (quote/risk asset ids, floor_ratio_bps 5000..9800, term, trigger, min_deposit, max_tvl, price_max_age, early-exit fee, settlement timeout, fees, escrow account) |
| P-4.2 | Position fields (owner, deposit, floor, risk_budget, risk_units, cost_basis, realised_quote, de_risked, opened_at, matures_at, state enum, nav_quote) |
| P-4.3 | The twelve money formulas implemented identically in Rust and TypeScript |
| P-4.4 | Invariants I1–I6 hold at every block |
| P-4.5 | State machine Open→Active→DeRisked→Matured→Settled; Degraded from timeouts |
| P-4.6 | Integer rules: u128, checked ops, floor division, no f64 in on-chain math |
| P-4.7 | Golden vector identical in Rust and TypeScript |
| P-4.8 | Edge cases 1–13 tested (min deposit, 98% ratio under crash, boundary trigger strict <, no re-invest, idempotent settlement, ErrNotMatured, ErrNotOwner, TVL cap, pause semantics, NFT transfer moves claim, price→0, escrow foreign caller, escrow wrong state) |

## 4. Contracts

| ID | Requirement |
|---|---|
| C-6.1 | Escrow: `new(vault, quote_asset)`, `ft_on_transfer` (lock per position), `release` gated on predecessor==vault AND terminal state, `locked_for`, `locked`, errors ErrNotVault/ErrBadState/ErrExceedsFloor/ErrBadMsg |
| C-6.2 | Vault: `new(config, escrow, treasury, secondary_oracle)`, deposit via ft_transfer_call, record_buy, record_settlement, de_risk, settle, exit_early, emergency_recover, admin setters, views, NEP-171 transfer/transfer_call/token |
| C-6.2b | Events: Deposited, ReserveEscrowed, BuyAuthorized, BuySettled, DeRiskTriggered, DeRiskSettled, PositionSettled, PositionDegraded, PositionTransferred, PausedSet |
| C-6.2c | Error set: ErrNotOwner … ErrEscrowRejected |
| C-6.2d | Access control: owner (multisig in production) / keeper / anyone / nobody |
| C-6.2e | Gas measured per method in `artifacts/gas.json` |
| C-6.2f | NEP-141 receiver + NEP-171 standards compliance |

## 5. Backend (Next.js Route Handlers under `/api`)

| ID | Requirement |
|---|---|
| K-6.3.1 | GET /api/healthz with dependency probes |
| K-6.3.2 | GET /api/vault/positions (+ per-account) |
| K-6.3.3 | GET /api/vault/position/[id] → {position, nav, worst_case, de_risk_armed, attestation?} |
| K-6.3.4 | POST /api/v1/rebalance (idempotent per position+epoch) |
| K-6.3.5 | GET /api/quote (venue quote, cached) |
| K-6.3.6 | GET /api/v1/attestation/:id (honest pending) |
| K-6.3.7 | POST /api/agent/policy · /api/agent/deposit (server-side re-validation) |
| K-6.3.8 | Durable JSON stores with the same interface as the production DB swap |
| K-6.3.9 | Failure handling: retries, degraded path, reconcile on restart |
| K-6.3.10 | Rate limits per route |
| K-6.3.11 | Automated keeper loop (polls → signs → submits; oracle-signed) |

## 6. Web

| ID | Requirement |
|---|---|
| W-6.5.1 | `/` pitch + loss-limit preview slider |
| W-6.5.2 | `/create`: risk-asset picker (live 1Click list), loss-limit slider (50–98%), term, live worst case in $, states |
| W-6.5.3 | `/vault/[id]`: position card, floor, NAV, risk bucket, de-risk status, settle/exit, real wallet txs |
| W-6.5.4 | Copy rules: worst case in $ always visible; banned phrases none |
| W-6.5.5 | Loading/empty/error/wallet-rejected states |

## 7. Functional requirements

F-01 deposit≥min mints NFT + escrows exactly F · F-02 below-min reverts · F-03 split exact · F-04 escrow rejects foreign callers · F-05 escrow rejects non-settle states · F-06 real venue swap with tx hash · F-07 stale price rejected · F-08 oracle disagreement rejected · F-09 risk budget never exceeded · F-10 de-risk fires at trigger · F-11 de-risk single-shot · F-12 payout == NAV · F-13 NFT transfer moves the claim · F-14 settlement idempotent · F-15 degraded recovery · F-18 DCA (deferred) · F-19 policy-parser golden cases · F-20 policy clamp + on-chain rejection (test-level) · F-21 agent deposit honours policy · F-22 vault rejects out-of-range ratios · F-23 policies persisted + fetchable (SHA-256 of mandate only)

## 8. Non-functional

NF-01 legibility in 90 seconds · NF-02 reproducible from a clean clone · NF-03 deterministic contract math · NF-04 THREAT_MODEL + secrets clean · NF-05 LIMITATIONS linked · NF-06 keeperless recovery · NF-07 gas measured · NF-08 wasm size disclosed

## 9. Integrations

SP-8.1 1Click adapter (tokens/quote/deposit/status; JWT-aware) · SP-8.2 Chain Signatures (position-owned derived address) · SP-8.3 equity venue adapter with live fallback · SP-8.4 NEAR AI attestation (deferred) · SP-8.5 Rhea collateral receipt (design note)

## 10. Test plan

T-1 unit math (Rust+TS golden) · T-2 invariant fuzz sequences · T-3 parameter fuzz · T-4 escrow-specific tests · T-5 live testnet integration txs · T-6 parity golden · T-7 Playwright E2E · T-8 static analysis + audit gates · T-9 determinism · T-10 negative/attack cases

## 11. Launch checklist

Public repo · README with quickstart + addresses + limitations + equity-route disclosure · no secrets in history · `.env.example` · LICENSE · rate limits + security headers · `/legal` reviewed by counsel before public launch
