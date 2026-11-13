/**
 * Real in-memory token-bucket rate limiter for the public API routes.
 * Per-IP buckets keyed by route family. Honest limitation: per-process, so
 * multi-instance deployments need a shared store (documented in the README
 * ops runbook) — the default single-node deployment is fully covered.
 */

const BUCKETS = new Map<string, { tokens: number; last: number }>();

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
}

const DEFAULTS: Record<string, RateLimitOptions> = {
  quote: { limit: 30, windowMs: 60_000 }, // §6.3: /v1/quote 30/min/IP
  "crash-sim": { limit: 10, windowMs: 60_000 }, // §6.3: /v1/crash-sim 10/min/IP
  deposit: { limit: 5, windowMs: 60_000 },
  prices: { limit: 60, windowMs: 60_000 },
  activity: { limit: 60, windowMs: 60_000 },
  vault: { limit: 120, windowMs: 60_000 },
};

export function rateLimit(
  routeFamily: keyof typeof DEFAULTS | string,
  ip: string,
  options?: RateLimitOptions
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const opts = options ?? DEFAULTS[routeFamily] ?? { limit: 60, windowMs: 60_000 };
  const key = `${routeFamily}:${ip}`;
  const now = Date.now();
  const bucket = BUCKETS.get(key) ?? { tokens: opts.limit, last: now };

  // Refill linearly.
  const elapsed = now - bucket.last;
  const refill = (elapsed / opts.windowMs) * opts.limit;
  bucket.tokens = Math.min(opts.limit, bucket.tokens + refill);
  bucket.last = now;

  if (bucket.tokens < 1) {
    const retryAfterSec = Math.ceil(((1 - bucket.tokens) * opts.windowMs) / opts.limit / 1000);
    BUCKETS.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.tokens -= 1;
  BUCKETS.set(key, bucket);
  return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (deploy-portable). */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Standard 429 response with Retry-After. */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Slow down and retry." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, retryAfterSec)),
      },
    }
  );
}
