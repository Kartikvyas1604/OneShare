"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/app/components/CopyButton";

/**
 * The position's treasury address on other chains, derived by the REAL
 * Chain Signatures MPC network (v1.signer-prod.testnet). Only the contract
 * holding the position can sign for this address — SPINE #2. Derivation is
 * pure math on public data; receiving assets on it requires mainnet MPC.
 */
export function ChainSigAddress({ positionId }: { positionId: number | string }) {
  const [addr, setAddr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/derived-address?account=${encodeURIComponent(
            process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID ?? "vault3.floorline-escrow.testnet"
          )}&path=floorline-${positionId}`
        );
        if (!res.ok) return;
        const body = (await res.json()) as { evm_address?: string };
        if (!cancelled && body.evm_address) setAddr(body.evm_address);
      } catch {
        /* decorative absence is fine */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [positionId]);

  if (!addr) return null;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground">MPC treasury (EVM):</span>
      <CopyButton value={addr} label={addr} />
      <span className="text-[10px] text-faint">derived by v1.signer-prod.testnet</span>
    </div>
  );
}
