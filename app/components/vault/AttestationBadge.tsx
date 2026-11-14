import { Badge } from "@/app/components/Badge";
import { ShieldCheck } from "lucide-react";

const VERIFY_URL = "https://cloud.near.ai/verify";

/**
 * De-risk enforcement status for the keeper's decision.
 * "pending" is the honest fallback label (R3): the local rule runs until the
 * attestation flow is verified — the badge is never faked.
 */
export function AttestationBadge({
  status,
  hash,
}: {
  status: "attested" | "pending";
  hash?: string;
}) {
  if (status === "attested" && hash) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <Badge variant="up">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Keeper rule · deterministic
        </Badge>
        <code className="num text-[11px] text-muted-foreground">{hash}</code>
        <a
          href={VERIFY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Verify at cloud.near.ai
        </a>
      </span>
    );
  }
  return (
    <Badge variant="neutral">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      De-risk rule · deterministic (formula 6)
    </Badge>
  );
}
