# NEEDS FROM ME — things only the user can provide

Everything else is built, running and verified on testnet. These are the
items that need a human decision, credential, or real money:

## Blocking the hackathon submission itself

1. **Record the demo video** (60–120 s, phone-grade is fine) — beats: the
   `/crash` three-arm at −45%, a live deposit via the wallet UI, the
   jailbreak output (`node scripts/agent-jailbreak.mjs`), the NFT transfer,
   the position NFT in a wallet. Suggested script: `agent/Agent.md` §11.
2. **Post it on X** stating it was built at NEAR HACKATHON, tagging
   `@NEARProtocol` + `#NEARHackathon`, video attached. Save the status URL —
   it is the `demoUrl`.
3. **Submit the hackathon form** (one submission per repo — print and
   confirm the payload before POST):
   - Repo: `https://github.com/Kartikvyas1604/OneShare` (public, tag
     `v1-submitted-safe` pushed)
   - `demoUrl`: the X status URL
   - Tracks: `defi` + `nfts` + `business` (do NOT add `privacy` unless the
     TEE leg verifies)
   - Payout: a **mainnet NEAR account you create** (lowercase, valid regex)
   - No `website` field (spam trap)
4. Save the confirmation screenshot to `artifacts/submission-proof/`.

## Blocking the green remote CI run

5. **Unlock GitHub Actions billing** — every remote CI run fails at start
   with *"The job was not started because your account is locked due to a
   billing issue"* (runs 43516276725, 43534669827, 43534906879). Fix the
   billing/spending limit in the GitHub account settings. The workflow is
   complete and every step passes locally — see `docs/AUDIT.md`.

## For the TEE attestation leg (U5/G-6)

6. **Configure NEAR AI credits for the key you provided** — the key
   AUTHENTICATES (the models list returns) but inference returns
   `402 no_limit_configured`: *"No spending limit configured. Please contact
   support to set up credits."* Set the spending limit / claim credits at
   `nearbuilders.org/dashboard` (or NEAR AI support). The moment inference
   works, `GET /api/v1/attestation/:id` flips to `verified: true` with the
   TEE response signature — no code change needed. The agent-policy LLM leg
   (`AGENT_POLICY_SOURCE=llm`) activates the same way.

## For real-money flows

7. **A funded mainnet NEAR account** (≤ $5) — enables the mainnet contract
   deploy + the F-06 real ≤$2 buy via 1Click (the spec's R2).
8. **A small USDC balance on any non-NEAR chain** (~$1 on Base or Polygon) —
   proves the cross-chain deposit path end-to-end with a real 1Click deposit
   address (NEAR Intents has no testnet; the flow is wired against the live
   API).
9. **Optional: a production domain + hosting account** (Vercel/Fly token) —
   the Dockerfile + CI are ready.
10. **Optional: a paid RPC key** for production traffic (the app defaults to
    `https://near-testnet.drpc.org` / fastnear; free tiers throttle).

## Decisions only you can make

11. **Legal review** of the non-US-person disclosure before real users (T-08).
12. **Whether to commission a third-party audit** before any real value
    enters the contracts (T-01). The invariant suites + mutation checks are
    the pre-audit answer, not the substitute.
