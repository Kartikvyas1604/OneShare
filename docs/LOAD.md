# Load test results — 13 Nov 2026

Harness: `scripts/load-test.mjs` (concurrent workers, p50/p95/p99/max latency,
status mix). Server: the production build (`next build && next start`) on
localhost, macOS arm64, Node 24.

| Target | Workers × time | Result | First bottleneck |
|---|---|---|---|
| `GET /` (static, no limiter) | 50 × 10s | **926 req/s**, p50 40ms, p95 56ms, 0 errors (9,257×200) | none observed at this scale |
| `GET /api/prices` (1Click-bound) | 30 × 10s | rate-limited by design: 429×30,679 vs 200×68 (60/min/IP) | **rate limiter** (spec §6.3) |
| `POST /api/v1/crash-sim` (CPU-bound) | 8 × 8s | rate-limited by design: 429×20,343 vs 200×11 (10/min/IP) | **rate limiter** (spec §6.3) |
| `POST /api/v1/crash-sim` sequential (no concurrency) | 5 requests | **~185ms per 10,000-path simulation** (0.179–0.196s) | CPU per simulation |

## Reading

- The **rate limiter is the designed first bottleneck** for untrusted public
  traffic: quote 30/min/IP, crash-sim 10/min/IP (§6.3). Public load past those
  budgets gets 429 + `Retry-After` — by spec, protecting the 1Click upstream
  and CPU.
- The static marketing page sustains **~930 req/s** at p95 56ms on one node —
  the browser bundle + CDN will be the practical ceiling long before this.
- The deterministic simulation costs **~185ms of CPU per run** (10,000 paths ×
  90 steps). Trusted internal traffic (the keeper's own crash-sim calls) should
  therefore be capped at ~5 concurrent runs per node; scale by adding nodes —
  the handler is stateless.

## Breaking point (where it fails first)

1. Rate limiter (by design, per-IP) → 429.
2. CPU on crash-sim bursts beyond the limiter's protection → queue latency
   growth (~185ms of CPU each).
3. Upstream: 1Click quote/deposit latency and its own rate limits.
