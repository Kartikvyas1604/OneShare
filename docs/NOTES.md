# NOTES — what the sponsors said is broken

Per spec R7: record the sponsor-booth/Telegram conversations and what changed
because of them.

## NEAR Intents / 1Click (the funding spine)

- **What we asked:** "What is broken for you right now with the Ondo route?"
- **What we found ourselves (12–13 Nov 2026, live API + RPC verification):**
  the 1Click token list has **231 tokens and zero tokenized equities**;
  `nep141:nvdaon.omft.near` returns `tokenOut is not valid`; `nvdaon.near`
  on mainnet is an empty account (no contract, no balance). Ondo×1Click API
  access was announced 31 Oct 2026 as a plan, not shipped.
- **What changed because of it:** the demo ships on the verified fallback
  asset with the identical mechanism; the equity wedge is a parameter in the
  contract (`risk_asset_id`) — when the listing lands, one config value
  points the vault at the real asset with zero contract change. The
  honesty disclosure lives in the README and `LIMITATIONS.md`.

## NEAR AI Cloud (TEE attestation)

- Attempted within the sprint window; the hour-20 deadline passed without a
  verified end-to-end attestation. Per the spec's own rule (U5: "tonight or
  delete it"), every TEE claim was removed from the demo and the badge
  returns honest `pending` state. The de-risk rule runs as a deterministic
  local rule (formula 6).

## Chain Signatures (SPINE #2)

- The MPC contract (`v1.signer-testnet.testnet` in the CLI config) supports
  testnet derivation; the build references real derivation semantics but
  does not execute MPC signatures (mainnet-only path). Disclosed in
  `LIMITATIONS.md` #10 rather than implied.
