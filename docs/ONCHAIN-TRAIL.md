# On-chain demo trail — Floorline testnet (vault3)

Every step below is a real transaction on NEAR testnet with live market data.
Contracts: `vault3.floorline-escrow.testnet` (quote `wrap.testnet`, risk
`nvda.floorline-escrow.testnet`), escrow `floorline-escrow.testnet`.

## The loop (all receipts green)

| Step | What happened | Tx |
| --- | --- | --- |
| Deposit | 1.5 wNEAR via `ft_transfer_call`, vault splits 90/10 → 1.35 escrowed (I1), position 1 minted (`Deposited`) | `FM7x3sbV9Lguua6EXmzq3H5cBTNBV6v9YTudbDkGbcxj` |
| Keeper buy | 3,255 nNVDA minted into the vault; `record_buy` with the **live** NVDA price ($162.32, Yahoo) vs wNEAR $3.53 (1Click) → `BuySettled`, cost 0.15 wNEAR | `GfaXkKZfpppLAyjUNt3vEPPnr7v6vf3AaumP4iVb6CJf` |
| Crash −55% | `record_de_risk` at the crash price → `DeRiskTriggered` (formula 6: 0.0675 wNEAR < 50% of 0.15 cost), bucket sold, proceeds locked (I6) | `C59NUaCdUTrrW9eNUknYLRhndmW22gDi2i9XwGejfgdP` |
| Early exit | `exit_early` → escrow releases 1.35 wNEAR through the gated path (state cross-check passes on `Settled`) → payout **1.4033052 wNEAR** to the owner (`PositionSettled` + wrap transfer) | `C5WTGPVpvc7vBScXnvqbwV11v3xnJChU4hDKFVi9995d` |

## What the numbers say

- Naive: 1.5 wNEAR fully in NVDA at the crash = **0.675 wNEAR (−55%)**.
- Floorline: floor 1.35 wNEAR held in escrow (I1), de-risk captured 0.0675 of the
  0.15 bucket, paid **1.4033 wNEAR (−6.4%)** after the 1% early-exit fee.

## Bugs this trail surfaced and fixed (all in this commit)

1. **wrap.testnet 3.1.0 gas trap** — `ft_transfer_call` does a bare
   `prepaid_gas() − 30 TGas`; attaching ≤ 30 TGas panics with "attempt to
   subtract with overflow" *after* the tokens moved. `GAS_DEPOSIT` 25 → 45,
   and the UI deposit now attaches 150 TGas.
2. **Quote-decimal mismatch** — the math hardcoded USDC's 6 decimals; wNEAR is
   24. `quote_decimals`/`risk_decimals` are now config fields threaded through
   `nav`/`unit_value_quote`/`target_units`.
3. **Price freshness impossible to satisfy** — the check compared
   nanoseconds against a 60,000-ns window; now `block_timestamp() / 1e6` vs a
   millisecond quote timestamp.
4. **Early exit could never release** — the escrow gate only accepted
   Matured/Degraded, but `exit_early` never marked the position terminal.
   `exit_early` now marks `Settled` (dedup-guarded) before releasing, the gate
   accepts `Settled`, and the failure callback restores the true prior state.
5. **Escrow release targeted the wrong contract** — `do_transfer` called
   `ft_transfer` on the recipient account instead of the token contract.
6. **NVDA faucet traps** — `mint`/`register` panicked on already-registered
   accounts (token state outlives account recreation); both are idempotent.

## Live price feeds (no mock data)

- `/api/v1/equity-price` — NVDA via Yahoo Finance chart API (30 s cache).
- `/api/prices` — wNEAR/USDC via the 1Click token list.
