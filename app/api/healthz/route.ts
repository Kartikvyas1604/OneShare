import { NextResponse } from "next/server";
import { log, requestIdOf } from "@/app/lib/log";
import { VAULT_CONTRACT_ID } from "@/app/lib/vault";

/**
 * Real health check — probes the two production dependencies (NEAR JSON-RPC
 * and the 1Click API) with tight timeouts and reports what is actually
 * reachable. 200 while the node is up; dependency details for monitoring.
 */
export async function GET() {
  const requestId = requestIdOf(new Request("http://healthz"));
  const started = Date.now();

  const probe = async (name: string, fn: () => Promise<unknown>) => {
    const t0 = Date.now();
    try {
      await fn();
      return { name, ok: true, latencyMs: Date.now() - t0 };
    } catch (err) {
      return {
        name,
        ok: false,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message.slice(0, 200) : "failed",
      };
    }
  };

  const [rpc, oneClick] = await Promise.all([
    probe("near-rpc", async () => {
      const res = await fetch(process.env.NEAR_RPC_URL ?? "https://rpc.mainnet.near.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "healthz", method: "status", params: {} }),
        signal: AbortSignal.timeout(5_000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as { result?: unknown };
      if (!body.result) throw new Error("no status payload");
    }),
    probe("oneclick", async () => {
      const res = await fetch("https://1click.chaindefuser.com/v0/tokens", {
        signal: AbortSignal.timeout(5_000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = await res.json();
      const tokens = Array.isArray(body) ? body : (body.tokens ?? []);
      if (tokens.length === 0) throw new Error("empty token list");
    }),
  ]);

  const ok = true; // the node serving this is up; dependency details inform alerting
  log.info("healthz", { requestId, rpc: rpc.ok, oneclick: oneClick.ok, ms: Date.now() - started });

  return NextResponse.json({
    ok,
    version: process.env.npm_package_version ?? "0.1.0",
    contract: VAULT_CONTRACT_ID,
    dependencies: [rpc, oneClick],
    checkedAt: new Date().toISOString(),
  });
}
