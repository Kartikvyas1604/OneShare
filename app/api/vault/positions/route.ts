import { NextResponse } from "next/server";
import { fetchPositions, isNotDeployed, VAULT_CONTRACT_ID } from "@/app/lib/vault";

/** Real on-chain positions for an account (query param `account`). */
export async function GET(request: Request) {
  const account = new URL(request.url).searchParams.get("account");
  if (!account || !account.endsWith(".near")) {
    return NextResponse.json({ error: "Missing or invalid ?account" }, { status: 400 });
  }
  try {
    const positions = await fetchPositions(account);
    return NextResponse.json({ positions, contract: VAULT_CONTRACT_ID });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Vault read failed",
        notDeployed: isNotDeployed(err),
        contract: VAULT_CONTRACT_ID,
      },
      { status: 502 },
    );
  }
}
