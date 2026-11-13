import { NextResponse } from "next/server";
import { fetchPosition, isNotDeployed, VAULT_CONTRACT_ID } from "@/app/lib/vault";

/** Real on-chain position by numeric token id. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const positionId = Number(id);
  if (!Number.isInteger(positionId) || positionId < 0) {
    return NextResponse.json(
      { error: `Position id must be a numeric NEP-171 token id, got "${id}"` },
      { status: 400 },
    );
  }
  try {
    const position = await fetchPosition(positionId);
    if (!position) {
      return NextResponse.json(
        { error: `Position ${positionId} does not exist on ${VAULT_CONTRACT_ID}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ position, contract: VAULT_CONTRACT_ID });
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
