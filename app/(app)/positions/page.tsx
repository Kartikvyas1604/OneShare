"use client";

import { useMemo, useState } from "react";
import { PositionCard } from "@/app/components/PositionCard";
import { EmptyState } from "@/app/components/EmptyState";
import { ErrorState } from "@/app/components/ErrorState";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { MOCK_POSITIONS, NVDA_TICKER } from "@/app/lib/data";
import { PieChart, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/Button";

export default function PositionsPage() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const positions = useMemo(() => MOCK_POSITIONS, []);
  const currentPrice = NVDA_TICKER.price_usdc;

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn’t load positions"
        description="This is usually a network hiccup. Try again in a moment."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (positions.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No positions yet"
        description="Your first one takes 60 seconds. Pay with any token, any chain."
        action={{ label: "Buy your first share", href: "/buy" }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Positions</h1>
        <Link href="/buy">
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {positions.map((position) => (
          <PositionCard
            key={position.id}
            position={position}
            ticker={NVDA_TICKER}
            currentPrice={currentPrice}
          />
        ))}
      </div>
    </div>
  );
}
