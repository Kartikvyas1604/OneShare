import { Suspense } from "react";
import { PositionDetail } from "./PositionDetail";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { MOCK_POSITIONS } from "@/app/lib/data";

export const instant = false;

/**
 * Resolve the URL param to the internal numeric position id.
 * Accepts the hex id (case-insensitive, with or without the 0x
 * prefix) and falls back to the legacy numeric id.
 */
function resolveId(raw: string) {
  const key = raw.toLowerCase().replace(/^0x/, "");
  const position =
    MOCK_POSITIONS.find((p) => p.hex_id.toLowerCase().replace(/^0x/, "") === key) ??
    MOCK_POSITIONS.find((p) => String(p.id) === raw);
  return position?.id ?? NaN;
}

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      }
    >
      <PositionDetail id={resolveId(id)} />
    </Suspense>
  );
}
