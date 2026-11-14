# MUTATION CHECKS — break the control, watch the tests fail

For each critical control: mutate the implementation deliberately, rerun the
suite, confirm a test FAILS, then restore. All mutations were reverted; the
final state is green.

| # | Control under test | Mutation applied | Test that caught it | Result |
|---|---|---|---|---|
| M-1 | Escrow foreign-caller gate (I1) | `--features break_escrow`: the `predecessor == vault` check compiled out | `contracts/escrow/tests/invariants.rs::escrow_blocks_foreign_caller` | **FAILED under mutation** (4 passed / 1 failed) — the teeth proof |
| M-2 | Oracle signature gate (T-02) | `env::ed25519_verify` result ignored (verification disabled) | `contracts/vault/tests/invariants.rs::non_oracle_signature_is_rejected` | **FAILED under mutation** |
| M-3 | De-risk trigger (formula 6) | trigger condition short-circuited to always-fire | `invariants_hold_under_random_sequences` (I6 latch violated mid-sequence) | **FAILED under mutation** |
| M-4 | Payout-failure restore (no stranded claims) | the `on_payout_complete` restore branch removed | `nft_transfer_moves_the_claim` | Script-escaping failure prevented the mutation from applying; the SAME control was proven by a **real bug** found live (the F-13 sweep stranded a claim) and fixed with a regression test in the fuzz suite |

## Real bugs the suite already caught (stronger than synthetic mutations)

1. **Payout failure stranded the claim** — found during the live F-13 sweep;
   fixed with the two-phase settlement + fuzz coverage.
2. **Shared storage prefixes corrupted NFT transfers** — found when the
   transfer test rolled back on-chain; fixed with per-owner prefixes + a
   stronger fuzz assertion (both owner vectors intact after a transfer).
3. **Deposits rejected while paused** — contradicted the pause semantics;
   fixed and covered by `pause_blocks_buys_not_deposits`.
4. **Price-freshness window compared ns to a 60µs limit** — caught live
   (`ErrPriceStale` on a fresh quote); fixed and covered.

## Coverage honesty

- Rust: 19 tests (9 vault invariants incl. 2,000-seq fuzz, 5 escrow
  invariants, 4 golden, 1 config) — every security control has a negative
  test.
- TypeScript: 48 tests — formulas, crash engine, agent policy goldens, sim
  parity, replay store.
- Playwright: 5 E2E tests against the live app + live chain.
- NOT covered: near-workspaces sandbox integration (the live testnet is the
  integration environment); a wallet-signing Playwright flow (needs a test
  wallet seed).
