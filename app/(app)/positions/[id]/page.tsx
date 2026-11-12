import { Suspense } from "react";
import { PositionDetail } from "./PositionDetail";
import { SkeletonCard } from "@/app/components/SkeletonCard";

export const instant = false;

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
      <PositionDetail id={Number(id)} />
    </Suspense>
  );
}
