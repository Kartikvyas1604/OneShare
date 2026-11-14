# LIMITATIONS — every weakness, stated

This file is the honesty surface. Each item: what is limited, what it means
for a real deployment, and what closes it.

## Contract layer

1. **Not audited.** The escrow invariant suites (2,000-sequence fuzz checking
   I1/I2/I3/I6 after every operation, plus the `--features break_escrow`
   build that FAILS the foreign-caller test) are this build's answer. A
   formal third-party audit is the production answer before the contracts
   hold real value. Residual risk: a bug the fuzzer's operation alphabet
   misses.
2. **Contract size.** The vault wasm is 256 KB after `wasm-opt -Oz`. near-sdk 5's
   baseline. No functional impact; disclosed rather than hidden.
3. **Admin keys are single-signer on testnet.** `set_paused` /
   `set_secondary_oracle` / `set_treasury` are treasury-account-gated. In
   production these belong behind a multisig.
4. **Oracle is single-key.** Quotes must be ed25519-signed by one configured
   oracle key (verified live). A compromised oracle key can feed bad prices —
   bounded by the risk-budget cap (I2) and the single-shot de-risk (I6), but
   production needs multiple independent oracles + a TWAP (THREAT_MODEL T-02).
5. **No on-chain secondary-oracle disagreement check.** The
   `secondary_oracle` field exists; the disagreement bound is enforced at the
   keeper layer (two independent feeds), not on-chain. Disclosed; a full
   on-chain disagreement check needs a second on-chain price source.
6. **Default config is mainnet-USDC-framed.** `VaultConfig::default()` uses a
   hex USDC id as the quote asset; the testnet deployment overrides it with
   `wrap.testnet`. Deposits on mainnet must set the real USDC contract id.
7. **Settlement retries.** A failed payout restores the position for a retry
   (no stranded claims, no double-pay — the payout can only succeed if the
   reserve arrived). Persistent repeated failure would need keeper attention;
   availability is preserved for the owner.

## Product layer

8. **Tokenized equities: not live (verified 12–13 Nov).** 1Click lists 231 tokens,
   zero equities (verified 12–13 Nov 2026); `nvdaon.near` is an empty
   mainnet account. Testnet runs a real NEP-141 stand-in — real
   contract paths, real live prices (Yahoo + 1Click), but the equity
   exposure is a labeled stand-in with no external market. When Ondo stocks
   list on 1Click, the vault points at them with zero contract change.
9. **The risk-asset venue swap is simulated on testnet.** The contract's
   record_buy enforces slippage/freshness/caps on-chain, but on testnet
   there is no AMM for the stand-in token: the keeper "buys" via the token's
   faucet and reports the fill. On mainnet with a real 1Click asset the same
   call settles a real swap.
10. **Chain Signatures (SPINE #2) are not executed.** The MPC contract's
    derivation is real and referenced, but the position does not own a
    non-NEAR account in this build — receiving assets on a derived address
    requires mainnet MPC signing.
11. **1Click cross-chain funding is wired but not exercised end-to-end with
    real money.** Deposit addresses + status polling are live against the
    real 1Click API; no non-NEAR deposit was sent (testnet has no NEAR
    Intents, and mainnet funding needs the user's funds).
12. **UI amount precision.** The chain serializes u128 amounts as JSON
    numbers; JS floats lose precision above 2^53. The keeper parses
    u128-safely; display-level formatting rounds at ~1e24 scale. Exact
    ledger math stays on-chain.

## Process layer

13. **No Playwright E2E.** Read-only UI flows are covered by the smoke
    suite; a wallet-signing E2E needs a test wallet harness.
14. **No Postgres.** The deposit store is a durable single-instance JSON
    file (documented); the Postgres swap is a one-file change.
15. **Regulatory (T-08) is unsolved.** Tokenized-equity distribution needs a
    licensed distributor; the product is not available to US persons and
    markets no returns.
16. **One submission per repo.** Edits after submission go through
    `/request-changes` + an X reply.
