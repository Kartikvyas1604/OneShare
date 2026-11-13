# TESTNET SUBSTITUTES — faithful stand-ins behind adapters

Rule: a working substitute is allowed; canned data is not. Every substitute
keeps the production interface so moving to mainnet is config-only.

| Production dependency | No testnet equivalent? | The substitute (same interface) | Mainnet flip |
|---|---|---|---|
| **Ondo tokenized equities** (NVDAon as a NEP-141) | Yes — G-2 closed: 231 1Click tokens, zero equities; `nvdaon.near` is an empty mainnet account | `nvda.floorline-escrow.testnet` — a real NEP-141 ("nNVDA", 6 decimals, 100k supply) with a real faucet (`mint`, owner-gated). The vault's `risk_asset_id` is a config parameter; all buy/de-risk/settle math runs against it with LIVE NVDA prices from Yahoo Finance (`/api/v1/equity-price`) | `risk_asset_id: "nep141:<nvdaon-asset-id>"` in the vault config + `/api/prices` gains the 1Click quote. Zero contract change |
| **The equity venue swap** (AMM/1Click settlement) | No NVDA AMM exists on testnet | The keeper fetches the live price, the contract enforces slippage/freshness/I2 on the reported fill, and the stand-in token's faucet settles the leg (`record_buy` on-chain) | The same `record_buy` call settles a real 1Click swap; the keeper's venue call moves from the faucet to the 1Click executor |
| **Chain Signatures MPC signing** | Signing runs on mainnet MPC only | Derivation IS live on testnet: `v1.signer-prod.testnet.derived_public_key` returns the real child key per (vault, path) — `/api/v1/derived-address` derives each position's EVM address (live: `0x2f297091…` for position 1) | `v1.signer` + a funded mainnet vault; the `sign` flow needs no code change |
| **NEAR Intents cross-chain deposit** | NEAR Intents has NO testnet (spec Q-007) | The deposit-address flow is live against the real 1Click API (JWT-aware); addresses + status polling work today; no real non-NEAR deposit was sent | Fund any generated deposit address with real USDC; `/api/deposit/status` tracks it |
| **TEE attestation (NEAR AI Cloud)** | Needs NEAR_AI_API_KEY (not provided; U5 hour-20 deadline passed) | The de-risk rule runs as the deterministic on-chain rule (formula 6 + I6 latch); every attestation surface returns honest `pending` | Set `NEAR_AI_API_KEY` + wire the verifier flow; the `/api/v1/attestation/:id` contract stays |
| **Multi-oracle disagreement bound** | One oracle key configured | The on-chain ed25519 signature gate (T-02, live-proven) + keeper-layer two-feed agreement (Yahoo vs 1Click) | Add a second on-chain oracle contract + the `ErrOracleDisagreement` check (spec F-08) |
| **Postgres** | — (shipped single-instance) | Durable JSON stores (`app/lib/deposit-store.ts`, `app/lib/policy-store.ts`) with the same read/write interface | Swap the two store modules to a DB client (one file each) |
