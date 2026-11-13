# Launch Readiness Report — Floorline

_Date: 13 Nov 2026 · Verdict: **the web product is launch-ready as a real-data interface**; the on-chain core has one blocking dependency that is external to this repository._

## What is genuinely production-ready (verified, not assumed)

| Category | Status | Evidence |
|---|---|---|
| **Build** | ✅ | `next build` passes — 16 routes, static + PPR + dynamic split (output above) |
| **Testing** | ✅ | 29 unit tests (formula golden vector §4.5, de-risk boundary strictness, I6 latch, crash-sim byte-determinism NF-03, demo-script invariant) + 15-check smoke suite **run against the production build** |
| **CI** | ✅ | GitHub Actions: lint → typecheck → tests → copy hygiene → production build → critical audit → boots prod server → smoke suite |
| **Security** | ✅ | Security headers (XFO/nosniff/referrer/permissions/HSTS), per-IP token-bucket rate limits on every public route (429 + Retry-After verified), input validation on every endpoint (verified by smoke), no secrets in repo, `.env.example` documents every variable, `npm audit` clean at high/critical (7 moderate dev-only lint findings documented below) |
| **Reliability/Observability** | ✅ | `/api/healthz` probes both dependencies with real latency; structured JSON logs with correlation ids; error boundaries + typed error states on every surface |
| **Real data (no mocks)** | ✅ | grep across `app/` for every former fixture symbol returns zero matches. Prices/quotes/addresses from 1Click (live), positions from NEAR JSON-RPC, history from the nearblocks indexer, sim computed at runtime |
| **Honest degraded states** | ✅ | Contract not deployed → the chain's real error surfaced; deposit-address creation without the partner key → upstream rejection + remediation; attestation → `verified: false` pending. Nothing faked |
| **Legal** | ✅ | `/legal` ToS + Privacy (non-US, no-audit, third-party rails, retention/deletion) — marked for counsel review before public launch |
| **SEO** | ✅ | robots.txt, sitemap.xml, OG metadata, launch surfaces |
| **Infra** | ✅ | CI pipeline, Dockerfile (non-root, HEALTHCHECK on `/api/healthz`), compose with a durable `.data` volume, documented Vercel + self-host deploy and rollback (<1 min) |
| **Docs** | ✅ | README: API reference for every route handler, runbook (health/logs/deploy/rollback), onboarding from clone to local |

## Explicitly deferred (with reasons)

| Item | Why deferred | Owner |
|---|---|---|
| **Vault + escrow contract deployment on mainnet** | External to this repository — the Rust contracts are the other half of the build. The web layer is complete against the §6.2 interface and flips from "not deployed yet" to real data the moment it deploys. | Team (Rust) |
| **1Click partner `X-API-Key` (G-4)** | Manual registration at partners.near-intents.org. The deposit-address flow is fully implemented and activates on env set. | Team |
| **TEE attestation wiring (R3)** | Requires `NEAR_AI_API_KEY` + the verifier flow; the API shape is live and honestly pending. | Team |
| **Wallet Selector modal UI** | Position reads work with the injected-wallet standard today; the full modal (multi-wallet picker, transaction signing UX) is a UX upgrade, not a data-layer gap. | Next iteration |
| **typescript-eslint minimatch advisories** | 7 moderate, dev-lint-only (no runtime exposure); fixing needs a typescript-eslint major bump — deferred to avoid lint-rule churn at launch. Tracked in DECISIONS.md. | Next iteration |
| **Postgres for the deposit store** | Single-instance JSON store is real and durable for v1; Postgres swap is a one-file change (documented in the store module). | At scale |
| **Analytics** | Needs the user's provider choice before launch week. | User |

## Open risks to know before launch

1. **Regulatory (T-08, largest open risk):** tokenized-equity distribution needs a licensed distributor in production. The UI discloses non-US-only and the gating everywhere it appears.
2. **Contract audit (T-01):** the escrow invariant suite is the current answer; a formal third-party audit is the production answer before the contract holds real value.
3. **Oracle manipulation (T-02):** dual-oracle bound (3% disagreement, 60s staleness) is specified in the contract; the web layer consumes the bounded feed.
