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
  r = await fetch(`${BASE}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountMicro: 100_000_000, destinationAsset: "nep141:wrap.near" }),
  });
  j = await r.json();
  check("quote 200 + real minAmountOut", r.status === 200 && typeof j.quote?.minAmountOut === "string" && BigInt(j.quote.minAmountOut) > 0n, JSON.stringify(j).slice(0, 140));

  // 4. Quote validation — an invalid amount is rejected, not passed through.
  r = await fetch(`${BASE}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountMicro: -5 }),
  });
  check("quote rejects invalid amount with 400", r.status === 400);

  // 5. Deposit address — without the partner key: real rejection + remediation,
  //    never a fabricated address.
  r = await fetch(`${BASE}/api/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountMicro: 100_000_000, ownerAccountId: "floorline-demo.near" }),
  });
  j = await r.json();
  check("deposit without key: 502 + real error + remediation, no fake address", r.status === 502 && typeof j.error === "string" && typeof j.remediation === "string" && !j.depositAddress);

  // 6. Crash sim — deterministic: same request twice, byte-identical payload.
  const body = JSON.stringify({ shock_pct: -45 });
  r = await fetch(`${BASE}/api/v1/crash-sim`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const a = await r.json();
  r = await fetch(`${BASE}/api/v1/crash-sim`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const b = await r.json();
  check("crash-sim 200 + deterministic (NF-03)", r.status === 200 && JSON.stringify(a) === JSON.stringify(b));
  check("crash-sim shape per keeper spec", typeof a.floorline_loss_pct === "number" && typeof a.naive_loss_pct === "number" && Array.isArray(a.path));
  check("crash-sim demo-script invariant: -45% shock ~ -45% naive", a.naive_loss_pct > -46 && a.naive_loss_pct < -44, String(a.naive_loss_pct));

  // 7. Crash sim validation.
  r = await fetch(`${BASE}/api/v1/crash-sim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shock_pct: 500 }) });
  check("crash-sim rejects shock > 90 with 400", r.status === 400);

  // 8. Attestation — honest pending, never a fabricated quote.
  r = await fetch(`${BASE}/api/v1/attestation/1`);
  j = await r.json();
  check("attestation honestly pending", r.status === 200 && j.verified === false && j.quote === null && j.verify_url.startsWith("https://"));

  // 9. Vault reads — the real RPC error until the contract is deployed.
  r = await fetch(`${BASE}/api/vault/positions?account=priya.near`);
  j = await r.json();
  check("vault read surfaces the real on-chain state", r.status === 502 && typeof j.error === "string" && typeof j.notDeployed === "boolean", JSON.stringify(j).slice(0, 140));

  // 10. Vault validation.
  r = await fetch(`${BASE}/api/vault/position/not-a-number`);
  check("vault position rejects a non-numeric id", r.status === 400 || r.status === 502);

  // 11. Activity — real indexer txs.
  r = await fetch(`${BASE}/api/activity?account=wrap.near`);
  j = await r.json();
  check("activity returns real indexer txs", r.status === 200 && (j.txns ?? []).length > 0 && typeof j.txns[0].hash === "string");

  // 12. Security headers present.
  r = await fetch(`${BASE}/`);
  check(
    "security headers present",
    r.headers.get("x-frame-options") === "DENY" && r.headers.get("x-content-type-options") === "nosniff",
    `xfo=${r.headers.get("x-frame-options")}`
  );

  // 13. Rate limiting — hammer a small-bucket route until 429.
  let saw429 = false;
  for (let i = 0; i < 12; i++) {
    const rr = await fetch(`${BASE}/api/v1/crash-sim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shock_pct: -1 }),
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
