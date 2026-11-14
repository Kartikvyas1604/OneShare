import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { viewContract } from "@/app/lib/near";

const WRAP_CONTRACT = process.env.NEAR_WRAP_CONTRACT || "wrap.testnet";

/** GET /api/wrap-balance?account=… — the account's live wNEAR balance. */
export async function GET(request: Request) {
  const __rl = rateLimit("wrap-balance", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  const account = new URL(request.url).searchParams.get("account");
  if (!account || !/^[a-z0-9._-]{2,64}$/.test(account)) {
    return NextResponse.json({ error: "invalid account" }, { status: 400 });
  }
  const balance = await viewContract<string>(WRAP_CONTRACT, "ft_balance_of", {
    account_id: account,
  });
  return NextResponse.json({ balance: balance ?? "0" });
}
