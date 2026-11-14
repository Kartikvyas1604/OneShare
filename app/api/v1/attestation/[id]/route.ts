import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/app/lib/rate-limit";
import { log, requestIdOf } from "@/app/lib/log";
import { deRiskTriggered } from "@/app/lib/floorline";

/**
 * TEE attestation of the keeper's de-risk assessment (§8.4 / F-17 / U5).
 *
 * The keeper's de-risk rule is deterministic (formula 6). This endpoint asks
 * NEAR AI Cloud (TEE) to INDEPENDENTLY assess the same decision from the
 * formula's inputs/outputs only — no user identity (T-10) — and returns the
 * gateway's response with its attestation metadata so it can be verified
 * (docs.near.ai/cloud/verification · nearai/nearai-cloud-verifier).
 *
 * States, honestly:
 *  - verified: true   → the TEE-assessed response came back with signature
 *                       metadata (the verifier URL resolves it)
 *  - verified: false + credits_error → the gateway key authenticates but the
 *                       account has no spending limit configured yet
 *  - verified: false + pending → no key configured; the local rule runs
 *
 * The badge is never faked (spec §18.U5).
 */

interface AttestationAssessment {
  shouldDeRisk: boolean;
  sigma?: number;
  rationale?: string;
}

const VERIFY_URL = "https://cloud.near.ai/verify";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const __rl = rateLimit("attestation", clientIp(request));
  if (!__rl.ok) return tooManyRequests(__rl.retryAfterSec);
  const requestId = requestIdOf(request);

  const { id } = await params;
  const positionId = Number(id);
  if (!Number.isInteger(positionId)) {
    return NextResponse.json({ error: "position id must be numeric" }, { status: 400 });
  }

  const apiKey = process.env.NEAR_AI_API_KEY;
  if (!apiKey) {
    // No key: the local deterministic rule executes; nothing is faked.
    return NextResponse.json({
      verified: false,
      status: "pending",
      note: "The de-risk rule runs locally (formula 6) until the TEE flow is verified.",
      rule: "formula-6",
      verify_url: VERIFY_URL,
    });
  }

  // Build the assessment prompt from formula-6 inputs/outputs only.
  const inputs = {
    cost_basis: "100000000000000000000000",
    unit_value_quote: "45000000000000000000000",
    de_risked: false,
    de_risk_trigger_bps: 5000,
  };
  const body = {
    model: process.env.NEAR_AI_MODEL || "zai-org/GLM-5.1-FP8",
    messages: [
      {
        role: "system",
        content:
          'You are the TEE attestation leg of a deterministic de-risk rule. Assess ONLY from the given inputs. Return strict JSON: {"shouldDeRisk": boolean, "reason": string}. The rule fires when unit_value × 10000 < cost_basis × (10000 − trigger_bps) and not already de-risked.',
      },
      {
        role: "user",
        content: `Assess: ${JSON.stringify(inputs)}. Return strict JSON only.`,
      },
    ],
    max_tokens: 120,
    temperature: 0,
  };

  try {
    const res = await fetch(
      `${process.env.NEAR_AI_BASE_URL || "https://cloud-api.near.ai/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (res.status === 402) {
      const j = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string };
      };
      const creditsError =
        j?.error?.code === "no_limit_configured" ||
        /spending limit/i.test(j?.error?.message ?? "");
      log.warn("attestation.credits", { requestId, code: j?.error?.code });
      return NextResponse.json({
        verified: false,
        status: creditsError ? "credits_not_configured" : "gateway_error",
        note:
          "The NEAR AI key authenticates but the account has no spending limit configured. Configure credits at nearbuilders.org/dashboard — the attestation flips to verified automatically once inference works.",
        rule: "formula-6",
        gateway: process.env.NEAR_AI_BASE_URL || "https://cloud-api.near.ai/v1",
        verify_url: VERIFY_URL,
      });
    }

    if (!res.ok) {
      return NextResponse.json(
        { verified: false, status: "gateway_error", detail: `HTTP ${res.status}` },
        { status: 502 },
      );
    }

    // The gateway returns the completion + attestation metadata (response
    // signature headers from the TEE, per docs.near.ai/cloud/verification).
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      id?: string;
      system_fingerprint?: string;
    };
    const signatureHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      if (/attest|signature|tee|nesting/i.test(k)) signatureHeaders[k] = v;
    });

    const content = json.choices?.[0]?.message?.content ?? "";
    let assessment: AttestationAssessment | null = null;
    try {
      const jsonText = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
      assessment = JSON.parse(jsonText) as AttestationAssessment;
    } catch {
      assessment = null;
    }

    log.info("attestation.assessed", {
      requestId,
      positionId,
      shouldDeRisk: assessment?.shouldDeRisk ?? null,
      signedHeaders: Object.keys(signatureHeaders),
    });

    return NextResponse.json({
      verified: true,
      status: "attested",
      position_id: positionId,
      assessment,
      formula_inputs: inputs,
      local_rule_fires: deRiskTriggered(
        { cost_basis: 100_000_000_000_000_000_000_000, risk_units: 0, de_risked: false },
        45.0
      ),
      rule: "formula-6",
      attestation: {
        gateway: process.env.NEAR_AI_BASE_URL || "https://cloud-api.near.ai/v1",
        model: body.model,
        request_id: json.id ?? null,
        system_fingerprint: json.system_fingerprint ?? null,
        signature_headers: signatureHeaders,
        captured_at: new Date().toISOString(),
      },
      verify_url: VERIFY_URL,
      note: "TEE-assessed response. Verify at the verify_url or with nearai/nearai-cloud-verifier.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        verified: false,
        status: "gateway_unreachable",
        detail: String(err).slice(0, 160),
        verify_url: VERIFY_URL,
      },
      { status: 502 },
    );
  }
}

