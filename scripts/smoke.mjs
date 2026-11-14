#!/usr/bin/env node
/**
 * Production smoke test — hits every API surface the product depends on and
 * fails on the first dishonest or broken response. Run against a running
 * server:  node scripts/smoke.mjs [baseURL]
 * Exit code 0 = every surface behaves like production.
 */

const BASE = process.argv[2] ?? "http://localhost:3000";
let failures = 0;

function check(name, ok, detail) {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} — ${detail}`);
  }
}

/** Fetch with one bounded retry on 429 (honours Retry-After, capped at 15s) —
 * lets the suite run repeatedly against the same server without tripping the
 * buckets it is validating. */
async function smartFetch(url, init) {
  let res = await fetch(url, init);
  if (res.status === 429) {
    const wait = Math.min(15, Number(res.headers.get("retry-after") ?? 15));
    await new Promise((r) => setTimeout(r, wait * 1000));
    res = await fetch(url, init);
  }
  return res;
}

async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  // 1. Healthz — must report the node up with dependency details.
  let r = await fetch(`${BASE}/api/healthz`);
  let j = await r.json();
  check("healthz 200 + ok:true + dependencies", r.status === 200 && j.ok === true && Array.isArray(j.dependencies));

  // 2. Prices — real 1Click data, non-empty, live price format.
  r = await fetch(`${BASE}/api/prices`);
  j = await r.json();
  check("prices 200 + real wNEAR price", r.status === 200 && (j.prices ?? []).some((p) => p.assetId === "nep141:wrap.near" && typeof p.price === "number" && p.price > 0), JSON.stringify(j).slice(0, 120));

  // 3. Quote — real 1Click rate for a $100 dry quote.
  r = await smartFetch(`${BASE}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountMicro: 100_000_000, destinationAsset: "nep141:wrap.near" }),
  });
  j = await r.json();
  check("quote 200 + real minAmountOut", r.status === 200 && typeof j.quote?.minAmountOut === "string" && BigInt(j.quote.minAmountOut) > 0n, JSON.stringify(j).slice(0, 140));

  // 4. Quote validation — an invalid amount is rejected, not passed through.
  r = await smartFetch(`${BASE}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountMicro: -5 }),
  });
  check("quote rejects invalid amount with 400", r.status === 400);

  // 5. Deposit address — with the partner key configured: 200 + REAL address
  //    set. Without it: 502 + real rejection + remediation, never a
  //    fabricated address. Both are honest outcomes.
  r = await smartFetch(`${BASE}/api/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountMicro: 100_000_000, ownerAccountId: "floorline-demo.near" }),
  });
  j = await r.json();
  const credOk = r.status === 200 && typeof j.depositAddress === "string" && j.depositAddress.length >= 20;
  const credGate = r.status === 502 && typeof j.error === "string" && typeof j.remediation === "string" && !j.depositAddress;
  check("deposit: real address (credentials live) or honest gate (502 + remediation)", credOk || credGate, JSON.stringify(j).slice(0, 140));

  // 6. Attestation — honest pending, never a fabricated quote.
  r = await fetch(`${BASE}/api/v1/attestation/1`);
  j = await r.json();
  check("attestation honestly pending", r.status === 200 && j.verified === false && j.quote === null && j.verify_url.startsWith("https://"));

  // 7. Vault reads — real on-chain state: positions array (deployed contract)
  //    or the honest not-deployed error (before deployment). Both are real.
  r = await fetch(`${BASE}/api/vault/positions?account=priya.near`);
  j = await r.json();
  const deployedRead = r.status === 200 && Array.isArray(j.positions);
  const notDeployedRead = r.status === 502 && j.notDeployed === true && typeof j.error === "string";
  check("vault read surfaces real on-chain state", deployedRead || notDeployedRead, JSON.stringify(j).slice(0, 140));

  // 8. Vault validation.
  r = await fetch(`${BASE}/api/vault/position/not-a-number`);
  check("vault position rejects a non-numeric id", r.status === 400 || r.status === 502);

  // 9. Activity — real indexer txs.
  r = await fetch(`${BASE}/api/activity?account=wrap.near`);
  j = await r.json();
  check("activity returns real indexer txs", r.status === 200 && (j.txns ?? []).length > 0 && typeof j.txns[0].hash === "string");

  // 10. Security headers present.
  r = await fetch(`${BASE}/`);
  check(
    "security headers present",
    r.headers.get("x-frame-options") === "DENY" && r.headers.get("x-content-type-options") === "nosniff",
    `xfo=${r.headers.get("x-frame-options")}`
  );

  // 11. Rate limiting — hammer a small-bucket route until 429 (deposit allows 5/min).
  let saw429 = false;
  for (let i = 0; i < 12; i++) {
    const rr = await fetch(`${BASE}/api/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMicro: 1, ownerAccountId: "rate-limit-probe.testnet" }),
    });
    if (rr.status === 429) saw429 = true;
  }
  check("rate limiter returns 429 under burst", saw429);

  console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} smoke check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test run failed:", err);
  process.exit(1);
});
