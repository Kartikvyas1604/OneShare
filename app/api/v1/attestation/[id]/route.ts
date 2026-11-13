import { NextResponse } from "next/server";
import { log, requestIdOf } from "@/app/lib/log";

/**
 * Keeper API §6.3 — GET /v1/attestation/:id
 *
 * The real contract: the keeper's de-risk decision runs in NEAR AI Cloud (TEE)
 * and this endpoint returns the attestation quote + verification URL for it.
 * Until NEAR_AI_* credentials are configured and the TEE flow verifies
 * end-to-end, the response is honestly `verified: false` with the pending
 * explanation — never a fabricated quote.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = requestIdOf(_request);
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Attestation id must be the numeric position id" },
      { status: 400 },
    );
  }

  const teeConfigured = Boolean(process.env.NEAR_AI_API_KEY);

  if (teeConfigured) {
    // The TEE flow exists but is not wired in this build — say so plainly
    // rather than implying an attestation happened.
    log.warn("attestation.request", {
      requestId,
      positionId: id,
      note: "NEAR_AI_API_KEY present but TEE verification not wired",
    });
    return NextResponse.json({
      position_id: id,
      quote: null,
      signature: null,
      verified: false,
      verify_url: "https://cloud.near.ai/verify",
      status: "pending",
      note: "TEE credentials configured; the verify flow is not wired in this build.",
    });
  }

  log.info("attestation.request", { requestId, positionId: id, status: "pending" });
  return NextResponse.json({
    position_id: id,
    quote: null,
    signature: null,
    verified: false,
    verify_url: "https://cloud.near.ai/verify",
    status: "pending",
    note: "The de-risk rule runs locally (formula 6) until the TEE flow is verified.",
  });
}
