/**
 * E2E test wallet — a REAL signing wallet for Playwright.
 *
 * Registered as a Wallet Selector module ONLY when the page has
 * `localStorage.E2E_WALLET_ENABLED === "1"` (set by the E2E test). It signs
 * genuine transactions with a generated testnet key (near-js v5 flow:
 * encode → sha256 → sign → SignedTransaction) and broadcasts them through
 * the real RPC — no mocks; the chain's real result flows back to the UI.
 *
 * The key + account id come from localStorage (set by the test after it
 * funded the account through the real chain).
 */
import type { InjectedWallet, WalletModuleFactory } from "@near-wallet-selector/core";
import { actionCreators, encodeTransaction, SignedTransaction, Signature } from "@near-js/transactions";
import { KeyPair } from "@near-js/crypto";
import { sha256 } from "@noble/hashes/sha2.js";
import bs58 from "bs58";

const E2E_FLAG = "E2E_WALLET_ENABLED";
// broadcast_tx_commit is not exposed by every RPC host; fastnear has it + CORS.
const RPC = (process.env.NEXT_PUBLIC_E2E_BROADCAST_RPC || "https://rpc.testnet.fastnear.com").replace(/\/$/, "");

interface E2EParams {
  secretKey: string; // ed25519:…
}

async function rpcCall(method: string, params: unknown): Promise<unknown> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "e2e", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error).slice(0, 220));
  return json.result;
}

function behaviourFactory(params: E2EParams) {
  return async (_options: unknown) => {
    const keyPair = KeyPair.fromString(params.secretKey as `ed25519:${string}`);
    const publicKey = keyPair.getPublicKey();
    // The account is the one the test provisioned (a named testnet account).
    const accountId = window.localStorage.getItem("E2E_WALLET_ACCOUNT") as string;

    const sendTx = async (receiverId: string, actions: Array<Record<string, unknown>>): Promise<unknown> => {
      // Real nonce + block hash from the live chain. NEAR hashes are base58.
      const accessKey = (await rpcCall("query", {
        request_type: "view_access_key",
        finality: "final",
        account_id: accountId,
        public_key: publicKey.toString(),
      })) as { nonce: string | number };
      const block = (await rpcCall("block", { finality: "final" })) as { header: { hash: string } };
      const blockHash = new Uint8Array(bs58.decode(block.header.hash));

      // near-js v5 signing: encode the tx, sign sha256 of the bytes.
      const message = encodeTransaction({
        signerId: accountId,
        publicKey,
        nonce: BigInt(accessKey.nonce) + 1n,
        receiverId,
        actions: actions as never,
        blockHash,
      } as never);
      const hash = sha256(message);
      const { signature } = keyPair.sign(hash);
      const signedTx = new SignedTransaction({
        transaction: {
          signerId: accountId,
          publicKey,
          nonce: BigInt(accessKey.nonce) + 1n,
          receiverId,
          actions: actions as never,
          blockHash,
        } as never,
        signature: new Signature({ keyType: 0, data: signature }),
      });

      // broadcast_tx_commit — the raw signed borsh bytes go on the real chain.
      const outcome = (await rpcCall("broadcast_tx_commit", [
        Buffer.from(signedTx.encode()).toString("base64"),
      ])) as {
        status: { Failure?: unknown };
        transaction_outcome: { id: string };
      };
      if (outcome.status?.Failure) {
        throw new Error(
          "Transaction failed: " + JSON.stringify(outcome.status.Failure).slice(0, 300)
        );
      }
      return outcome;
    };

    // The behaviour object is cast to the selector's exact behaviour type.
    const behaviour = {
      async signIn() {
        return [{ accountId }];
      },
      async signOut() {
        return;
      },
      async getAccounts() {
        return [{ accountId }];
      },
      async verifyOwner() {
        throw new Error("verifyOwner not supported by the E2E wallet");
      },
      async signMessage() {
        throw new Error("signMessage not supported by the E2E wallet");
      },
      async signAndSendTransaction(args: unknown) {
        const { receiverId, actions } = args as {
          receiverId: string;
          actions: Array<Record<string, unknown>>;
        };
        // near-js v5 does NOT stringify args eagerly: an object arg corrupts
        // the borsh encoding ("Unexpected length of input" on the RPC).
        // Convert FunctionCall args to the exact JSON bytes the contract
        // expects — matching what the real wallets send.
        const built = actions.map((a) => {
          const call = (a as { functionCall?: { methodName: string; args: unknown; gas: string | bigint; deposit: string | bigint } }).functionCall;
          if (!call) throw new Error("E2E wallet only supports functionCall actions");
          const argsBytes =
            call.args instanceof Uint8Array
              ? call.args
              : new Uint8Array(Buffer.from(JSON.stringify(call.args)));
          return actionCreators.functionCall(call.methodName, argsBytes, BigInt(call.gas), BigInt(call.deposit));
        });
        return await sendTx(receiverId, built as unknown as Array<Record<string, unknown>>);
      },
      async signAndSendTransactions(args: unknown) {
        const { transactions } = args as {
          transactions: Array<{ signerId?: string; receiverId: string; actions: Array<Record<string, unknown>> }>;
        };
        const outcomes: unknown[] = [];
        for (const tx of transactions) {
          outcomes.push(await behaviour.signAndSendTransaction({ ...tx, signerId: accountId }));
        }
        return outcomes;
      },
    };
    return behaviour as unknown as Omit<InjectedWallet, "id" | "type" | "metadata">;
  };
}

/**
 * The Wallet Selector module factory. Returns null unless the page enabled
 * E2E mode (localStorage flag) — production wallets are unaffected.
 */
export function setupE2EWallet(): WalletModuleFactory<InjectedWallet> {
  return (async () => {
    const enabled =
      typeof window !== "undefined" &&
      window.localStorage.getItem(E2E_FLAG) === "1" &&
      window.localStorage.getItem("E2E_WALLET_SECRET") &&
      window.localStorage.getItem("E2E_WALLET_ACCOUNT");
    if (!enabled) return null;

    const params: E2EParams = {
      secretKey: window.localStorage.getItem("E2E_WALLET_SECRET") as string,
    };

    return {
      id: "e2e-wallet",
      type: "injected",
      metadata: {
        name: "E2E Test Wallet",
        description: "Automated test wallet signing real testnet transactions",
        iconUrl: "",
        deprecated: false,
        available: true,
      },
      init: (options: unknown) =>
        behaviourFactory(params)(options as never) as Promise<
          Omit<InjectedWallet, "id" | "type" | "metadata">
        >,
    };
  }) as WalletModuleFactory<InjectedWallet>;
}
