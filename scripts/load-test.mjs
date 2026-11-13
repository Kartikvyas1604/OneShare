#!/usr/bin/env node
/**
 * Load test — the core-checklist "run it once, know where it breaks first"
 * item. Drives concurrent traffic against a target endpoint and reports
 * throughput, latency percentiles, and the error mix.
 *
 * Usage: node scripts/load-test.mjs <path> [concurrency] [seconds] [method] [body]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";
const [path, concurrencyArg, secondsArg, methodArg, bodyArg] = process.argv.slice(2);
const TARGET = `${BASE}${path ?? "/"}`;
const CONCURRENCY = Number(concurrencyArg ?? 20);
const DURATION_S = Number(secondsArg ?? 10);
const METHOD = methodArg ?? "GET";
const BODY = bodyArg ?? null;

const latencies = [];
const statuses = new Map();
let errors = 0;
let stop = false;

async function worker(id) {
  while (!stop) {
    const t0 = performance.now();
    try {
      const res = await fetch(TARGET, {
        method: METHOD,
        headers: BODY ? { "Content-Type": "application/json" } : undefined,
        body: METHOD !== "GET" && BODY ? BODY : undefined,
      });
      const ms = performance.now() - t0;
      latencies.push(ms);
      await res.arrayBuffer(); // drain
      statuses.set(res.status, (statuses.get(res.status) ?? 0) + 1);
    } catch {
      errors++;
      const ms = performance.now() - t0;
      latencies.push(ms);
    }
  }
}

function pct(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(p * sorted.length)] ?? 0;
}

console.log(`Load test: ${CONCURRENCY} workers x ${DURATION_S}s -> ${METHOD} ${TARGET}\n`);

const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
const start = performance.now();
setTimeout(() => {
  stop = true;
}, DURATION_S * 1000);

await Promise.allSettled(workers);
const wall = (performance.now() - start) / 1000;

const total = latencies.length;
const rps = total / wall;
const sorted = [...latencies].sort((a, b) => a - b);
const statusLine = Array.from(statuses.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([s, c]) => `${s}x${c}`)
  .join("  ");

console.log(`requests: ${total}  · throughput: ${rps.toFixed(1)} req/s`);
console.log(`latency  p50: ${pct(sorted, 0.5).toFixed(0)}ms   p95: ${pct(sorted, 0.95).toFixed(0)}ms   p99: ${pct(sorted, 0.99).toFixed(0)}ms   max: ${Math.max(...sorted).toFixed(0)}ms`);
console.log(`statuses: ${statusLine}   network errors: ${errors}`);
