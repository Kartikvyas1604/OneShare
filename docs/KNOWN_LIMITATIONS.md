# KNOWN LIMITATIONS — what is not production grade

The canonical, numbered list lives in [`docs/LIMITATIONS.md`](LIMITATIONS.md)
(kept in sync with `docs/AUDIT.md`). Summary of the material ones:

1. **Unaudited contracts** — the 20,000-sequence invariant fuzz, the
   `break_escrow` failing build, the live attack sweep and the mutation
   checks are the pre-audit answer. Do not point real value at these
   contracts before a third-party audit.
2. **Testnet substitutes** (see `docs/AUDIT.md` + `docs/TESTNET_SUBSTITUTES.md`):
   the NVDA risk asset is a real NEP-141 stand-in with no external market;
   the venue swap is faucet-settled on testnet; Chain Signatures derivation
   is live but MPC *signing* is mainnet-only; NEAR Intents has no testnet so
   the cross-chain deposit flow is wired against the live API but unproven
   with real money.
3. **Load limits** — a single JSON-file store (deposit + policy stores);
   a free public RPC (dRPC) with rate limits; no horizontal scaling; the
   keeper is a single process.
4. **Oracle** — one signed oracle key on-chain; the multi-oracle
   disagreement bound runs at the keeper layer.
5. **Regulatory** — tokenized-equity distribution needs a licensed
   distributor; not available to US persons; no returns marketed.
