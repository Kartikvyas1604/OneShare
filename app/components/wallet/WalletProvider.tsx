"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { WalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { actionCreators } from "@near-js/transactions";
import "@near-wallet-selector/modal-ui/styles.css";
import { VAULT_CONTRACT_ID } from "@/app/lib/vault";

/**
 * Real NEAR wallet connection through the official Wallet Selector: browser
 * wallet sign-in, a real connect modal, and real signed transactions. There
 * is no fallback probe — if no wallet is connected, the app shows that state.
 */

interface WalletContextValue {
  selector: WalletSelector | null;
  accountId: string | null;
  connecting: boolean;
  error: string | null;
  showConnect: () => void;
  signOut: () => Promise<void>;
  /** Sign a real contract-call transaction through the connected wallet. */
  signCall: (
    receiverId: string,
    methodName: string,
    args: Record<string, unknown>,
    gasTGas: number
  ) => Promise<unknown>;
}

const WalletContext = createContext<WalletContextValue>({
  selector: null,
  accountId: null,
  connecting: true,
  error: null,
  showConnect: () => {},
  signOut: async () => {},
  signCall: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const selectorInstance = await setupWalletSelector({
          network: "mainnet",
          modules: [setupMyNearWallet()],
        });
        const modalInstance = setupModal(selectorInstance, {
          contractId: VAULT_CONTRACT_ID,
          theme: "dark",
        });

        if (cancelled) return;

        // Current signed-in account from the selector store.
        const sync = () => {
          const state = selectorInstance.store.getState();
          const active = state.accounts.find((a) => a.active) ?? state.accounts[0];
          setAccountId(active?.accountId ?? null);
        };
        sync();
        selectorInstance.store.observable.subscribe(sync);

        setSelector(selectorInstance);
        setModal(modalInstance);
        setConnecting(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Wallet setup failed");
          setConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showConnect = useCallback(() => {
    modal?.show();
  }, [modal]);

  const signOut = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    setAccountId(null);
  }, [selector]);

  const signCall = useCallback(
    async (
      receiverId: string,
      methodName: string,
      args: Record<string, unknown>,
      gasTGas: number
    ) => {
      if (!selector) throw new Error("Wallet is not ready yet.");
      const state = selector.store.getState();
      const active = state.accounts.find((a) => a.active) ?? state.accounts[0];
      const signerId = active?.accountId;
      if (!signerId) throw new Error("No wallet is connected.");

      const wallet = await selector.wallet();
      // Real signed transaction (near-js Action) — the chain's real outcome,
      // including the contract's real errors, flows back to the caller.
      const gas = BigInt(gasTGas) * BigInt(10 ** 12); // TGas -> yoctoNEAR-adjacent gas units
      return await wallet.signAndSendTransaction({
        signerId,
        receiverId,
        actions: [actionCreators.functionCall(methodName, args, gas, BigInt(0))],
      });
    },
    [selector]
  );

  const value = useMemo(
    () => ({ selector, accountId, connecting, error, showConnect, signOut, signCall }),
    [selector, accountId, connecting, error, showConnect, signOut, signCall]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
