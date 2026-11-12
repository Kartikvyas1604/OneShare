import { SkeletonCard } from "@/app/components/SkeletonCard";

export default function AppLoading() {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
