"use client";

import { useEffect, useState } from "react";

export interface LivePrice {
  assetId: string;
  symbol: string;
  price: number;
  decimals: number;
  blockchain: string;
}

/**
 * Live 1Click token prices via the /api/prices route (real fetch, 60s
 * server cache). No hardcoded prices anywhere in the UI.
 */
export function useLivePrices(): {
  prices: Map<string, LivePrice>;
  loading: boolean;
  error: string | null;
} {
  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/prices");
        const body = (await res.json()) as { prices?: LivePrice[]; error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error(body.error ?? `Price fetch failed (${res.status})`);
        const map = new Map<string, LivePrice>();
        for (const p of body.prices ?? []) map.set(p.assetId, p);
        setPrices(map);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Price fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, loading, error };
}
