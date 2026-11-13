"use client";

import { useEffect, useState } from "react";

/**
 * Real connected NEAR account — reads the injected wallet API
 * (`window.near`, the standard injected by Wallet Selector wallets).
 * No hardcoded account names: when no wallet is connected, the app shows
 * that real state.
 */
export function useNearAccount(): { accountId: string | null; loading: boolean } {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const injected = (window as { near?: { getAccountId?: () => Promise<string | null> } }).near;
        const id = (await injected?.getAccountId?.()) ?? null;
        if (!cancelled) setAccountId(id && id.length > 0 ? id : null);
      } catch {
        if (!cancelled) setAccountId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { accountId, loading };
}
