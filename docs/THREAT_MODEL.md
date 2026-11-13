# THREAT MODEL — Floorline

Adversary classes, mitigations, and residual risk. The oracle-manipulation
reference case: Rhea Lend lost $18.4M to oracle manipulation (Apr 2026).

| # | Threat | Mitigation | Residual risk |
|---|---|---|---|
| T-01 | Reserve drained by a non-settle path | Separate `Escrow` contract; `release` gated on `predecessor == vault` **and** position state ∈ {Matured, Degraded, Settled}; the gate is exercised live (foreign release reverts `ErrNotVault`) and covered by the invariant fuzz | A bug in the escrow, or a vault upgrade, could still move it. Formal audit is the production answer. |
| T-02 | Oracle/price manipulation drives a bad de-risk or settlement | **On-chain ed25519 signature gate**: every quote must be signed by the configured oracle key over `floorline-quote:{pid}:{price}:{ts}` (`env::ed25519_verify`). Unsigned/forged/replayed quotes revert live. Plus 60 s price staleness (`ErrPriceStale`, verified live), I2 cap (verified), single-shot de-risk I6 (verified live) | One compromised oracle key still feeds bad prices — bounded by the risk cap; production needs multiple independent oracles + TWAP. |
| T-03 | Malicious keeper | The keeper signs quotes with the oracle key but moves no user funds: buys are capped by I2, de-risk by formula 6 + I6, settle/exit stay owner-signed | A bad keeper can grief (wrong buys within budget, missed de-risks). Funds remain recoverable; the owner can settle/exit without the keeper. |
| T-04 | Front-running of de-risks | The de-risk is a contract-enforced rule with a capped bucket; the damage is bounded by I2 | Without confidential execution the timing is public. Bounded impact. |
| T-05 | Integer overflow / rounding | `checked_*` + u256 intermediates in math; floor division; golden vectors in Rust and TS | Rounding dust < 1 unit per op; accepted and documented. |
| T-06 | Reentrancy via `ft_transfer_call` | Checks-effects-interactions; the position is written before the escrow transfer; the escrow ack finalizes state | Low. |
| T-07 | NFT transfer races settlement | `settle`/`exit_early` verify ownership and mark Settled before releasing; the payout failure restores the claim (no stranded funds) | Low. |
| T-08 | Regulatory (tokenized-equity distribution) | No US persons; eligibility disclosure; no returns marketing; the equity route is gated | **Real and unsolved.** Production needs a licensed distributor and a legal opinion. |
| T-09 | Equity-venue liquidity | The risk asset is a parameter; the demo asset is a stand-in with a real live price feed | The wedge is roadmap until the venue lists. |
| T-10 | Keeper/TEE operator reads user data | The quote message contains only public position id/price/timestamp — no user identity | None material. |
| T-11 | Testnet key compromise | The oracle seed and signer keys live in `.env.local` (gitignored) / keychain; testnet funds only | Production requires KMS/HSM + a funded mainnet account. |
| T-12 | Payout failure strands a claim | **Fixed and fuzz-covered**: the payout confirms in its own receipt; failure restores the position (no panic-rollback), the owner retries; double-pay is impossible because the payout can only succeed if the reserve arrived | Requires a retry; availability preserved. |

## Proven-live attack log (testnet, real txs — docs/ONCHAIN-TRAIL.md)

- Unsigned price → `ErrBadQuoteSignature` ✓ rejected
- Forged-key price → `ErrBadQuoteSignature` ✓ rejected
- Stale price → `ErrPriceStale` ✓ rejected
- Over-budget buy → `ErrRiskBudgetExceeded` ✓ rejected
- Double de-risk → `ErrAlreadyDeRisked` ✓ rejected
- Off-step loss limit (`deposit:10000`) → `ErrStepExceeded` ✓ rejected (the agent-jailbreak beat)
- Foreign `escrow.release` → `ErrNotVault` ✓ rejected
- Paused buy → `ErrPaused` ✓ rejected
- TVL cap → enforced (fuzz-proven with a small-cap config)
- Replayed `record_settlement` → no-op (`SettlementDeduped`) ✓
