# NEEDS FROM ME — things only you can provide

Everything else is built, tested and verified on testnet. These are the
items that need a human decision, credential, or real money:

## For submission (blocking — the spec's U0/U4)

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
   - Tracks: `defi` + `nfts` + `business` (do NOT add `privacy`)
   - Payout: a **mainnet NEAR account you create** (lowercase, valid regex)
   - No `website` field (spam trap)
4. Save the confirmation screenshot to `artifacts/submission-proof/`.

## For real-money flows (non-blocking for the hackathon)

5. **A funded mainnet NEAR account** (≤ $5) — enables the mainnet contract
   deploy + the F-06 real ≤$2 buy via 1Click (the spec's R2).
6. **A small USDC balance on any non-NEAR chain** (e.g. ~$1 on Base or
   Polygon) — proves the cross-chain deposit path end-to-end with a real
   1Click deposit address (NEAR Intents has no testnet; the flow is wired
   against the live API).
7. **Optional: `NEAR_AI_API_KEY`** from `nearbuilders.org/dashboard` —
   re-enables the TEE attestation leg (U5) if you want it back before the
   deadline. Without it the product is honestly shipped without TEE.
8. **Optional: a production domain + hosting account** (Vercel/Fly token) —
   the Dockerfile + CI are ready; the app currently runs wherever you point
   it.
9. **Optional: an RPC provider key** for production traffic (the app
   defaults to `https://near-testnet.drpc.org` / mainnet RPC; free tiers
   throttle under load).

## Decisions only you can make

10. **Legal review** of the non-US-person disclosure and the jurisdiction
    wording before real users (T-08). The copy is conservative; a lawyer
    should confirm.
11. **Whether to commission a third-party audit** before any real value
    enters the contracts (T-01). The invariant suites + mutation checks are
    the pre-audit answer, not the substitute.
