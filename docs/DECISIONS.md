# DECISIONS

Log per spec §0.4: date · ambiguity · choice · reason. Newest last.

- 2026-11-12 · Product name in the UI · **Floorline** · `agent/Agent.md` is the single source of truth and names the combined product Floorline (§18); OneShare was the pre-merge working name. `APP_CONFIG.name` and all UI strings follow.
- 2026-11-12 · `/create` slider label ("loss limit 50–98%, step 1%") vs `floor_ratio_bps` range (5_000..9_800, step 100) · **Slider value is the floor/reserve share, labelled "Loss limit", with the derived max-loss % (100% − floor) shown beside it** · The spec's UI range matches the floor-ratio range exactly; both readings stay true on screen.
- 2026-11-12 · Position identifiers in URLs · **Opaque hex ids (`/vault/0x…`) with a numeric fallback resolver** · On-chain `token_id` is a numeric u64 (§4.1); hex keeps URLs non-enumerable and matches the already-shipped routing.
- 2026-11-12 · Demo risk asset · **wNEAR via the verified 1Click fallback (`fallback-near`)** · G-2 requires the demo to not depend on the equity route; NVDAon/NVDAx candidates are shown but marked unverified.
- 2026-11-12 · NAV on the web · **Computed client-side from the current mock price (f64, display-only)** · §4.5 permits f64 for display; `nav_quote` remains persisted on-chain in the contract.
- 2026-11-12 · Crash simulator backend · **Deterministic three-arm Monte-Carlo runs in the browser with the same params and seed (20261112) as `sim/make_sim.py`; "Replay recorded run" serves the cached −45% result** · Zero-network demo per §11 fallback (2); the keeper's `POST /v1/crash-sim` stays authoritative for the recorded run.
- 2026-11-12 · `/vault/[id]` events feed · **Kept a compact contract-event log on the page** · Not listed in §6.5 but supports the demo line "here is the escrow, and here is the test"; events use the exact §6.2 event names.
- 2026-11-13 · Crash-sim GBM discretization · **Median-neutral step `exp(σ√dt·z)` (no Itô drift term)** · The canonical `exp((μ−0.5σ²)dt+σ√dt·z)` shows a −27% median loss at a 0% shock; the demo script (§11) states "A 45% crash. Naive loses 45%" — median-neutral makes that literally true. Python `sim/cppi.py` will match.
- 2026-11-13 · Positions minted from `/create` · **Ephemeral in-memory session store resolved client-side on `/vault/[id]`** · Satisfies the E2E flow (§10: `/create` → deposit → `/vault/[id]` shows the NFT) without hydration risk or URL state; fixtures stay the source for the recorded demo.
- 2026-11-13 · Real-data objective · **Every fixture removed; the app reads only real sources** · Live prices + quotes + deposit addresses from 1Click (verified unauthenticated endpoints), on-chain positions via JSON-RPC view calls (`positions_of` / `get_position`, §6.2) against `VAULT_CONTRACT_ID`, tx history from the nearblocks indexer. Until the vault contract is deployed, the UI shows the chain's real error ("account does not exist on NEAR mainnet yet") and real empty states — nothing simulated. Crash-sim numbers are computed at runtime by the deterministic engine (no stored results). Position ids in URLs are the on-chain numeric token ids; the earlier hex URL scheme was fixture-only and is retired.
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
   switches to the 1Click quote when NVDAon lists (G-2).
8. Full trail with tx ids: docs/ONCHAIN-TRAIL.md.
