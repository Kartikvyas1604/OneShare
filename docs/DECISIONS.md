# DECISIONS

Log: date · ambiguity · choice · reason. Newest last.

- 2026-11-12 · Product name in the UI · **Floorline** · OneShare was the pre-merge working name; the combined product ships as Floorline. `APP_CONFIG.name` and all UI strings follow.
- 2026-11-12 · `/create` slider label ("loss limit 50–98%, step 1%") vs `floor_ratio_bps` range (5_000..9_800, step 100) · **Slider value is the floor/reserve share, labelled "Loss limit", with the derived max-loss % (100% − floor) shown beside it** · The UI range matches the floor-ratio range exactly; both readings stay true on screen.
- 2026-11-12 · Position identifiers in URLs · **Opaque hex ids (`/vault/0x…`) with a numeric fallback resolver** · On-chain `token_id` is a numeric u64; hex keeps URLs non-enumerable and matches the already-shipped routing.
- 2026-11-12 · Risk asset · **wNEAR via the live 1Click route (`fallback-near`)** · the equity route is not live yet (verified 12–13 Nov); NVDAon/NVDAx candidates are shown but marked unverified.
- 2026-11-12 · NAV on the web · **Computed client-side from the current price (f64, display-only)** · f64 display is allowed because on-chain math is u128; `nav_quote` remains persisted on-chain in the contract.
- 2026-11-12 · Crash-sim engine · **Deterministic three-arm Monte-Carlo in the browser, shared params and seed with `sim/make_sim.py`** · *(Retired 2026-11-14 — see below.)*
- 2026-11-12 · `/vault/[id]` events feed · **Kept a compact contract-event log on the page** · Events use the contract's exact event names.
- 2026-11-13 · Crash-sim GBM discretization · **Median-neutral step `exp(σ√dt·z)` (no Itô drift term)** · *(Retired with the simulator on 2026-11-14.)*
- 2026-11-13 · Positions minted from `/create` · **Ephemeral in-memory session store resolved client-side on `/vault/[id]`** · Covers the `/create` → deposit → `/vault/[id]` flow without hydration risk or URL state.
- 2026-11-13 · Real-data objective · **Every fixture removed; the app reads only real sources** · Live prices + quotes + deposit addresses from 1Click (verified unauthenticated endpoints), on-chain positions via JSON-RPC view calls (`positions_of` / `get_position`) against `VAULT_CONTRACT_ID`, tx history from the nearblocks indexer. Until the vault contract is deployed, the UI shows the chain's real error ("account does not exist on NEAR mainnet yet") and real empty states — nothing simulated. Position ids in URLs are the on-chain numeric token ids; the earlier hex URL scheme was fixture-only and is retired.
- 2026-11-13 · Production hardening · **Keeper API versioned under `/api/v1`, healthz with dependency probes, per-IP token buckets, security headers, vitest + 15-check smoke suite in CI, Dockerfile + compose, ToS/Privacy at /legal** · Remaining known gaps are external dependencies (contract deployment, 1Click partner key, TEE credentials) surfaced honestly rather than simulated; the 7 moderate npm-audit findings are dev-lint-only (typescript-eslint/minimatch) and deferred with the major-bump risk documented.
- 2026-11-13 · Wallet connection · **Official Wallet Selector v10 (`my-near-wallet` module + modal) replaces the injected-wallet probe** · Real connect modal, real signed `functionCall` transactions for Settle / Exit early / Emergency recover (30 TGas, near-js actions), on-chain state re-read after confirmation. Transaction failures while the vault contract is undeployed surface the chain's real errors — the honest state until deployment.

## 2026-11-14 — On-chain demo loop session

1. **wrap.testnet's 3.1.0 `ft_transfer_call` needs > 30 TGas attached.** The
   old standard does a bare `prepaid_gas() − 30 TGas` (25T receiver + 5T
   resolve); attaching less panics "attempt to subtract with overflow" after
   the tokens already moved (refunds roll everything back). Vault constants:
   GAS_DEPOSIT 45 TGas, GAS_SETTLE 80, GAS_ESCROW_CALLBACK 30; the UI deposit
   attaches 150 TGas.
2. **Quote-asset decimals are config, not constants.** The math assumed USDC
   (6 dp); testnet runs wNEAR (24 dp). `quote_decimals`/`risk_decimals` are
   VaultConfig fields; price convention: `price_1e18` = whole-quote units per
   whole-risk unit, scaled 1e18.
3. **Price freshness compares ms to ms.** `env::block_timestamp()` is ns; the
   old check built a 60-µs window. Now `block_timestamp()/1e6` vs a
   millisecond quote timestamp.
4. **Early exit releases through the escrow gate.** `exit_early` marks the
   position Settled (terminal, dedup-guarded) before `release`; the escrow
   gate accepts Matured/Degraded/Settled; the failure callback restores the
   true prior state instead of assuming Matured.
5. **The escrow's `do_transfer` targets the token contract** (quote asset)
   with the release destination as receiver — it previously called
   `ft_transfer` on the recipient account.
6. **NVDA stand-in faucet is idempotent** — token registrations outlive
   account recreation on testnet, so `mint`/`register` skip existing accounts.
7. **Equity price feed**: `/api/v1/equity-price` (Yahoo Finance chart API,
   30 s revalidate) — real NVDA quotes for the wedge and the keeper path;
   switches to the 1Click quote when NVDAon lists.
8. Full trail with tx ids: docs/ONCHAIN-TRAIL.md.

## 2026-11-14 — product cut
1. **Crash simulator removed from the product.** The `/crash` page,
   `/api/v1/crash-sim`, the TS engine, `sim/make_sim.py` and the parity tests
   were demo scaffolding, not product surface. The landing hero now shows the
   contract's own 90/10 arithmetic inline; `make sim` and the seed-theater
   copy went with it.
2. **Fake-attestation "Explain" page removed.** It rendered a canned answer
   with a fabricated ed25519 signature snippet — deceptive by construction.
   The honest FAQ on the landing page covers the same questions.
3. **Agent jailbreak endpoint removed.** The clamp (deterministic parser) and
   the on-chain per-deposit ratio gate remain product features, covered by
   `tests/agent-policy.test.ts` and the live `ErrStepExceeded` proof.
4. **Hackathon framing stripped.** All copy now reads as product copy: fees
   "0% at launch", no event references anywhere in app, README, or docs.

## 2026-11-14 — production-readiness sprint

1. **I2 semantics after a de-risk sale.** `cost_basis +
   realised_quote ≤ R` double-counts a fully-sold bucket (cost spent +
   proceeds returned). Resolution: a full sale zeroes `cost_basis`; the
   bucket's footprint is `realised ≤ R` (a sale at the trigger returns ≤ cost
   by construction).
2. **Payout failure must not strand the claim.** The payout confirms in its
   own receipt; failure restores the position WITHOUT panicking (a panic
   rolls the restore back). No double-pay: the payout can only succeed if
   the reserve arrived. Same fix in the escrow's transfer callback.
3. **Per-owner storage prefixes.** `owner_positions` vectors shared one
   prefix; a transfer to a new owner corrupted shared storage. Prefix is now
   `owner_positions_v1:<account>`.
4. **Deposits are allowed while paused**; the pause gate
   covers buys and de-risks only.
5. **Per-deposit loss limit.** `msg = "deposit:<ratio_bps>"` overrides the
   vault ratio, clamped [5000, 9800] step 100 on-chain (F-22) — the agent
   policy's enforcement point, verified live with 8500 and rejected with
   10000 (ErrStepExceeded).
6. **Oracle trust.** On-chain ed25519 quote-signature verification (T-02):
   every record_buy/record_de_risk requires `floorline-quote:{pid}:{price}:
   {ts}` signed by the configured oracle key. Proven live: unsigned and
   forged quotes revert; signed pass.
7. **wrap.testnet's 3.1.0 `ft_transfer_call` needs prepaid > 30 TGas** (a
   bare `prepaid_gas() − 30 TGas` in the old standard). GAS_DEPOSIT 45; UI
   deposits attach 150 TGas.

## 2026-11-14 — logo

1. **Logo v2 — the float ring.** The first mark (falling line + floor) read
   as abstract line-art; replaced with a pictorial lifebuoy riding the accent
   sea: "when everything sinks, your position stays afloat," the ring reads
   as a coin. No lettering in the logo. Geometry lives in
   `scripts/make-logo.py`; brand.md documents the rules. The v1 line-mark is
   retired from all surfaces.

## 2026-11-14 — logo v3

1. **The float ring was replaced by the anchor lockup.** The user wanted a
   pictorial emblem paired with bold typography on a white background. The
   anchor tells the product story in one object — dropped at the sea floor,
   it holds while the storm moves the surface — and carries no clash risk
   (rare symbol in fintech). Wordmark moved to Geist SemiBold outlines;
   the Instrument Serif asset was retired from the brand assets.

## 2026-11-15 — logo v4

1. **The anchor was replaced by the safe.** The anchor said "holding" but
   not the whole product loop; the user wanted an emblem that reads as the
   complete story. The safe — money in, the floor locks the worst case,
   the depositor gets it back — is the classic finance-protection symbol
   and matches the private-banking tone. Same two-color system, same
   lockup format (emblem over the Geist wordmark on white).

## 2026-11-15 — logo v5

1. **The safe was replaced by the bank facade at the user's direction.**
   The classical building (pediment, columns, steps) is the timeless
   financial emblem, and the entablature beam in the accent color IS the
   product's namesake — the floor line the money stands on. Same two-color
   system and lockup format; the safe v4 assets are retired.

## 2026-11-15 — logo v6

1. **The logo went monochrome.** The mint beam read as decoration inside
   the mark, which fought the brand rule that color means money semantics.
   The facade is now one color per surface (ivory on the dark canvas, ink
   on white); the accent stays reserved for gains/losses in the UI. The
   primary lockup now sits on the product's own near-black canvas so the
   brand asset and the UI share one theme.
