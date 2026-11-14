/**
 * Diagnose a Supabase/Postgres connection from the repo.
 * Usage: node scripts/check-supabase.cjs
 */
const { Pool } = require("pg");
const fs = require("fs");

const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.+)$/m)?.[1]
  ?.trim();

if (!url) {
  console.log("DATABASE_URL is not set in .env.local");
  process.exit(0);
}

console.log("host:", new URL(url).host);
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

(async () => {
  const r = await pool.query("SELECT count(*) AS deposits FROM deposits");
  console.log("✓ connected — deposits rows:", r.rows[0].deposits);
  try {
    const p = await pool.query("SELECT count(*) AS policies FROM policies");
    console.log("✓ policies rows:", p.rows[0].policies);
  } catch {
    console.log("policies table not created yet (auto-migrates on first use)");
  }
  await pool.end();
})().catch((e) => {
  const msg = e.message || String(e);
  console.log("✗ connection failed:", msg.slice(0, 200));
  if (/ENOTFOUND|tenant/i.test(msg)) {
    console.log(
      "→ The Supabase project hostname does not resolve / the tenant is not\n" +
        "  found. Check: (1) the project exists and is not paused at\n" +
        "  supabase.com/dashboard, (2) the connection string is the CURRENT one\n" +
        "  (Settings → Database → Connection string → URI), (3) free-tier\n" +
        "  projects pause after a week of inactivity — restore from the dashboard."
    );
  }
  process.exit(1);
});
