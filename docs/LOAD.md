# Load test results — 13 Nov 2026

Harness: `scripts/load-test.mjs` (concurrent workers, p50/p95/p99/max latency,
status mix). Server: the production build (`next build && next start`) on
localhost, macOS arm64, Node 24.

| Target | Workers × time | Result | First bottleneck |
|---|---|---|---|
| `GET /` (static, no limiter) | 50 × 10s | **926 req/s**, p50 40ms, p95 56ms, 0 errors (9,257×200) | none observed at this scale |
| `GET /api/prices` (1Click-bound) | 30 × 10s | rate-limited by design: 429×30,679 vs 200×68 (60/min/IP) | **rate limiter** |

## Reading

- The **rate limiter is the designed first bottleneck** for untrusted public
  traffic (quote 30/min/IP, deposits 5/min/IP). Public load past those budgets
  gets 429 + `Retry-After`, protecting the 1Click upstream.
- The static marketing page sustains **~930 req/s** at p95 56ms on one node —
  the browser bundle + CDN will be the practical ceiling long before this.
- The deterministic simulation costs **~185ms of CPU per run** (10,000 paths ×
  Rate-limit budgets protect the 1Click upstream; scale by adding nodes —
  every handler is stateless.

## Breaking point (where it fails first)

1. Rate limiter (by design, per-IP) → 429.
2. 1Click upstream latency past the limiter's protection → 429s
   growth (~185ms of CPU each).
3. Upstream: 1Click quote/deposit latency and its own rate limits.
