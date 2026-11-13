import { log } from "@/app/lib/log";

/** OneClick /v0/status — the real deposit status for one deposit address. */
export async function fetchOneClickStatus(
  depositAddress: string
): Promise<{ status: string; raw: unknown }> {
  const res = await fetch(
    `https://1click.chaindefuser.com/v0/status?depositAddress=${encodeURIComponent(depositAddress)}`,
    { cache: "no-store" },
  );
  const raw = (await res.json()) as { status?: string };
  const status = raw.status ?? `HTTP ${res.status}`;
  log.info("oneclick.status", { status, depositAddress: depositAddress.slice(0, 10) + "…" });
  return { status, raw };
}
