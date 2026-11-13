# REQUIREMENTS — every item from agent/Agent.md, numbered

Source of truth: `agent/Agent.md` (964-line revision, 13 Nov 2026 19:45 UTC).
Every item gets a stable ID used in `docs/AUDIT.md`.

## 1. Gates

| ID | Requirement | Acceptance |
|---|---|---|
| G-1 | Risk asset quotable on 1Click | dry quote returns amountOut + minAmountOut |
| G-2 | Equity venue route | CLOSED-FAILED (verified 12–13 Nov) — ship fallback, disclose |
| G-3 | Two-contract escrow on testnet | foreign `release` reverts; vault path succeeds in terminal state |
| G-4 | Confidential execution (JWT) | open per K-2 — `CONFIDENTIALITY=public`, copy cleaned |
| G-5 | Agent policy clamps to contract ranges | both /api/agent checks return clamped values (U1) |
| G-6 | TEE attestation verifies | hour-20 deadline passed → full removal per U5 |

## 2. Build rules (§0)

| ID | Requirement |
|---|---|
| R-0.1 | Single source of truth for constants |
| R-0.2 | Never invent external strings — live calls saved in artifacts/verified/ |
| R-0.3 | Adapters for everything external; no external API calls from contract code or React components |
| R-0.4 | Ambiguity → simplest option + DECISIONS.md line |
| R-0.5 | Banned words grep = 0 matches; asset names only in the roadmap paragraph (U2) |
| R-0.6 | Monte-Carlo deterministic; `make sim` offline < 20 s |
| R-0.7 | No placeholders — every parameter has a default and a unit |
| R-0.8 | Definition of done = §17 |

## 3. Product semantics (§4)

| ID | Requirement |
|---|---|
| P-4.1 | VaultConfig fields (quote/risk asset ids, floor_ratio_bps 5000..9800, term, trigger, min_deposit, max_tvl, price_max_age, early_exit fee, settlement timeout, fees=0, escrow account) |
| P-4.2 | Position fields (owner, deposit, floor, risk_budget, risk_units, cost_basis, realised_quote, de_risked, opened_at, matures_at, state enum, nav_quote) |
| P-4.3 | Formulas (1)–(12) implemented identically in Rust and TS |
| P-4.4 | Invariants I1–I6 hold at every block |
| P-4.5 | State machine Open→Active→DeRisked→Matured→Settled; Degraded from timeouts |
| P-4.6 | Integer rules: u128, checked ops, floor division, no f64 in on-chain math |
| P-4.7 | Golden vector identical in Rust and TS |
| P-4.8 | Edge cases 1–13 tested (min deposit, 98% ratio crash, boundary trigger strict <, no re-invest, idempotent settlement, ErrNotMatured, ErrNotOwner, TVL cap, pause semantics, NFT transfer moves claim, price→0, escrow foreign caller, escrow wrong state) |

## 4. Contracts

| ID | Requirement |
|---|---|
| C-6.1 | Escrow: `new(vault, quote_asset)`, `ft_on_transfer` (lock per position), `release` gated on predecessor==vault AND terminal state, `locked_for`, `locked`, errors ErrNotVault/ErrBadState/ErrExceedsFloor/ErrBadMsg |
| C-6.2 | Vault: `new(config, escrow, treasury, secondary_oracle)`, deposit via ft_transfer_call, record_buy, record_settlement, de_risk, settle, exit_early, emergency_recover, set_paused/set_secondary_oracle/set_treasury, views (get_position, nav_of, worst_case, positions_of), NEP-171 transfer/transfer_call/token |
| C-6.2b | Events: Deposited, ReserveEscrowed, BuyAuthorized, BuySettled, DeRiskTriggered, DeRiskSettled, PositionSettled, PositionDegraded, PositionTransferred, PausedSet |
| C-6.2c | Errors: the full §6.2 list (ErrNotOwner … ErrEscrowRejected) |
| C-6.2d | Access control table (owner/keeper/anyone/nobody) |
| C-6.2e | Gas targets recorded in artifacts/gas.json |
| C-6.2f | NEP-141 receiver + NEP-171 standards compliance |

## 5. Keeper backend (§6.3 — Route Handlers in the shipped repo)

| ID | Requirement |
|---|---|
| K-6.3.1 | GET /healthz |
| K-6.3.2 | GET /v1/positions (+ per-account) |
| K-6.3.3 | GET /v1/positions/:id → {position, nav, worst_case, de_risk_armed, attestation?} |
| K-6.3.4 | POST /v1/rebalance (idempotent per position+epoch) |
| K-6.3.5 | GET /v1/quote (venue quote, cached 10 s) |
| K-6.3.6 | GET /v1/attestation/:id (honest pending) |
| K-6.3.7 | POST /v1/crash-sim (three arms, deterministic) |
| K-6.3.8 | Persistence (positions/swaps/quotes/nav_history) — JSON store shipped; Postgres swap documented |
| K-6.3.9 | Failure handling: retries, degraded path, reconcile on restart |
| K-6.3.10 | Rate limits per route |
| K-6.3.11 | Automated keeper loop (polls → signs → submits; oracle-signed) |

## 6. Simulation (§6.4)

| ID | Requirement |
|---|---|
| S-6.4.1 | simulate() pure function of (seed, paths, steps, params) |
| S-6.4.2 | Three arms: naive, static floor, floor+de-risk |
| S-6.4.3 | `make sim` writes artifacts/sim-baseline.json + SHA-256 |
| S-6.4.4 | F-16: web engine ↔ python parity ±0.5 pp |
| S-6.4.5 | TS engine parity with the contract math |

## 7. Web (§6.5)

| ID | Requirement |
|---|---|
| W-6.5.1 | `/` pitch + loss-limit slider preview + demo video |
| W-6.5.2 | `/create`: risk asset picker (live 1Click list), loss limit slider (50–98%), term, live worst case in $, states |
| W-6.5.3 | `/vault/[id]`: position card, floor, NAV, risk bucket, de-risk status, settle/exit buttons, real wallet txs |
| W-6.5.4 | `/crash`: THE DEMO PAGE — three arms, slider −90..+90, replay |
| W-6.5.5 | Copy rules: worst case in $ always visible; banned words none |
| W-6.5.6 | Loading/empty/error/wallet-rejected states |

## 8. Functional requirements (§7.1 + U1)

F-01 deposit≥min mints NFT + escrows exactly F · F-02 below-min reverts · F-03 split exact · F-04 escrow rejects foreign callers · F-05 escrow rejects non-settle states · F-06 real venue swap ≤$2 with tx hash · F-07 stale price rejected · F-08 oracle disagreement rejected · F-09 risk budget never exceeded · F-10 de-risk fires at trigger · F-11 de-risk single-shot · F-12 payout == NAV · F-13 NFT transfer moves the claim · F-14 settlement idempotent · F-15 degraded recovery · F-16 crash-sim matches make sim · F-17 TEE attestation fetchable+verifiable · F-18 DCA (STRETCH) · F-19 parser golden cases · F-20 jailbreak double-enforced · F-21 agent deposit honours policy · F-22 vault rejects out-of-range ratios · F-23 policies persisted + fetchable (SHA-256 of mandate only)

## 9. Non-functional (§7.2)

NF-01 90-second legibility · NF-02 reproducible from clean clone · NF-03 determinism · NF-04 THREAT_MODEL + secrets clean · NF-05 LIMITATIONS linked · NF-06 keeperless recovery · NF-07 gas targets recorded · NF-08 wasm ≤ 160 KB

## 10. Sponsor integrations (§8)

SP-8.1 1Click adapter (tokens/quote/deposit/status; JWT-aware) · SP-8.2 Chain Signatures (position-owned foreign address) · SP-8.3 EquityVenueAdapter with verified fallback · SP-8.4 NEAR AI attestation (or honest removal) · SP-8.5 Rhea (stretch, design note only)

## 11. Test plan (§10)

T-1 unit math (Rust+TS golden) · T-2 invariant suite 20k sequences (2,000 shipped — documented) · T-3 proptest fuzz · T-4 escrow-specific tests · T-5 sandbox integration happy path · T-6 parity golden · T-7 Playwright E2E · T-8 static (clippy/npm audit) · T-9 determinism · T-10 negative/attack cases

## 12. Sprint upgrades (§18)

U-0 submit-safe (push/tag/video/X/form/proof) · U-1 agent policy (G-5) · U-2 headline fix + asset-name rule · U-3 paired-floor paragraph · U-4 demo video · U-5 TEE verify-or-delete

## 13. Submission (§13)

Public repo · README with do-X-see-Y + addresses + limitations + G-2 disclosure · no secrets in history · .env.example · LICENSE · X post with tags · payout account · one submission per repo · artifacts/
