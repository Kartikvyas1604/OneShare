# Agent treasury policy (U1)

Floorline reframes the product for the agent economy: **an autonomous treasury
can write its own loss limit, and the escrow contract enforces it — prompt
guardrails are advisory, custody is not.**

## What the AI does (one sentence)

The AI translates a plain-English treasury mandate ("never lose more than
15%") into a structured policy `{floor_ratio_bps, term_seconds,
de_risk_trigger_bps}` — it never sets or moves the floor beyond the clamp.

## The three enforcement layers

| Layer | What it does | Where |
|---|---|---|
| 1. Parser (deterministic) | Mandate → policy; clamps to contract ranges | `app/lib/agent-policy.ts` (golden-tested) |
| 2. Clamp (the enforcement point) | An optional LLM leg passes through the **same** clamp — the LLM is never trusted | same file, `clampLlmPolicy` |
| 3. The contract (independent) | `ft_transfer_call` with `msg = "deposit:<ratio>"` — anything outside **[5000, 9800] step 100** reverts `ErrStepExceeded` | `contracts/vault/src/lib.rs` (F-22) |

## Endpoints

- `POST /api/agent/policy` `{mandate}` → `{policy}` (422 + remediation when no
  loss-limit percentage is found)
- `POST /api/agent/deposit` `{policy, amount, account}` → the exact unsigned
  on-chain instruction (201); re-validates every field server-side
- `POST /api/agent/jailbreak` `{mandate, floor_ratio_bps}` → the clamped policy
  **and** the contract's independent decision (rate-limited 6/min/IP)

## Live evidence (testnet, all real txs)

- `artifacts/agent-jailbreak.json` — both curl beats + the on-chain rejection:
  `msg: "deposit:10000"` → **ErrStepExceeded** (tx `2LaXnBED…`,
  `5gKKCCKq…`)
- A 85%-floor position deposited live: 2 wNEAR → floor 1.7 (F-22 accepted the
  in-range ratio)
- `scripts/agent-jailbreak.mjs` regenerates the artifact with one command.

## What the agent may never do

Set or move the floor beyond the clamp, touch the reserve, settle other
people's positions, or sign anything — the treasury key signs only the
deposit its policy produced, and the escrow's only door stays the vault's
settle path.
