/**
 * Real NEAR JSON-RPC view calls against the configured vault contract.
 * When the contract is not deployed yet, callers get the RPC's real error —
 * the UI surfaces it honestly instead of fabricating state.
 */

const RPC_URL = process.env.NEAR_RPC_URL ?? "https://rpc.mainnet.near.org";

export class NearRpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NearRpcError";
  }
}

/** The wallet provider connects to this network too. */
export const NEAR_NETWORK = process.env.NEAR_NETWORK ?? "testnet";

interface RpcViewResult<T> {
  result?: T;
  error?: {
    message?: string;
    data?: string;
    cause?: { info?: { account_id?: string } };
  };
}

/** View (read-only) contract method — args are JSON-serialized like the CLI does. */
export async function viewContract<T>(
  accountId: string,
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "floorline-ui",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: accountId,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      },
    }),
    cache: "no-store",
  });

  const body = (await res.json()) as RpcViewResult<{ result: Array<number>; logs: string[] }>;

  if (body.error) {
    const missing = body.error.cause?.info?.account_id;
    // The human-readable detail (e.g. "account X does not exist while viewing")
    // lives in error.data; "message" is a generic "Server error".
    const detail = body.error.data ?? body.error.message ?? `RPC query failed (${res.status})`;
    if (detail.includes("does not exist while viewing")) {
      throw new NearRpcError(`Account ${missing ?? accountId} does not exist on NEAR mainnet yet`);
    }
    if (detail.includes("MethodNotFound") || detail.includes("method not found")) {
      throw new NearRpcError(`Contract method ${methodName} not found on ${accountId}`);
    }
    throw new NearRpcError(detail);
  }

  const bytes = body.result?.result;
  // A view call returning no bytes means the contract returned `None` (e.g.
  // get_position for a settled/burned token) — not an error.
  if (!bytes || bytes.length === 0) return null as T;
  return JSON.parse(Buffer.from(bytes).toString("utf-8")) as T;
}
