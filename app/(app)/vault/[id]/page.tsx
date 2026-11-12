import { Suspense } from "react";
import { VaultDetail } from "./VaultDetail";
import { SkeletonCard } from "@/app/components/SkeletonCard";

export const instant = false;

export default async function VaultPage({
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
      <VaultDetail rawId={id} />
    </Suspense>
  );
}
