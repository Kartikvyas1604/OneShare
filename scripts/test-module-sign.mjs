import { actionCreators, encodeTransaction, SignedTransaction, Signature } from "@near-js/transactions";
import { KeyPair } from "@near-js/crypto";
import { sha256 } from "@noble/hashes/sha2.js";
import { readFileSync } from "node:fs";
import bs58 from "bs58";

const RPC = "https://rpc.testnet.near.org";
async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "m", method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 200));
  return j.result;
}

const key = JSON.parse(readFileSync(process.env.HOME + "/.near-credentials/testnet/nvda.floorline-escrow.testnet.json", "utf8"));
const keyPair = KeyPair.fromString(key.private_key);
const publicKey = keyPair.getPublicKey();
const accountId = key.account_id;
const receiverId = "wrap.testnet";
const actions = [actionCreators.functionCall("storage_deposit", Buffer.from(JSON.stringify({ account_id: accountId })), 10000000000000n, 1250000000000000000000n)];

const accessKey = await rpc("query", { request_type: "view_access_key", finality: "final", account_id: accountId, public_key: publicKey.toString() });
const block = await rpc("block", { finality: "final" });
const tx = {
  signerId: accountId,
  publicKey,
  nonce: BigInt(accessKey.nonce) + 1n,
  receiverId,
  actions,
  blockHash: new Uint8Array(bs58.decode(block.header.hash)),
};
const message = encodeTransaction(tx);
const hash = sha256(message);
const { signature } = keyPair.sign(hash);
const signedTx = new SignedTransaction({ transaction: tx, signature: new Signature({ keyType: 0, data: signature }) });
const outcome = await rpc("broadcast_tx_commit", [Buffer.from(signedTx.encode()).toString("base64")]);
console.log("status:", JSON.stringify(outcome.status).slice(0, 200), "| tx:", outcome.transaction_outcome.id);
