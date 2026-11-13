import { NextResponse } from "next/server";

/**
 * Real transaction history for an account from the nearblocks.io indexer.
 * Returns the indexer's real data (or its real error) — no fabricated events.
 */
export const revalidate = 30;

interface NearblocksTxn {
  transaction_hash?: string;
  block_timestamp?: string; // nanoseconds as string
  receiver_account_id?: string;
  predecessor_account_id?: string;
  receipt_outcome?: { status?: boolean };
}

export async function GET(request: Request) {
  const account = new URL(request.url).searchParams.get("account");
  if (!account) {
    return NextResponse.json({ error: "Missing ?account" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://api.nearblocks.io/v1/account/${encodeURIComponent(account)}/txns?per_page=8`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) {
      return NextResponse.json(
        { txns: [], error: `Indexer returned ${res.status}` },
        { status: 200 },
      );
    }
    const body = (await res.json()) as { txns?: NearblocksTxn[] };
    const txns = (body.txns ?? []).map((t) => ({
      hash: t.transaction_hash ?? "",
      ts: Math.round(Number(t.block_timestamp ?? 0) / 1_000_000), // ns → ms
      to: t.receiver_account_id ?? "",
      from: t.predecessor_account_id ?? "",
      ok: t.receipt_outcome?.status !== false,
    }));
    return NextResponse.json({ txns });
  } catch (err) {
    return NextResponse.json({
      txns: [],
      error: err instanceof Error ? err.message : "Indexer unavailable",
    });
  }
}
