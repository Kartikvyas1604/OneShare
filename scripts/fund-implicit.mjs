import nacl from "tweetnacl";
import bs58 from "bs58";
import crypto from "node:crypto";
import { encodeTransaction, actionCreators } from "@near-js/transactions";
import { KeyPair, PublicKey } from "@near-js/crypto";
import { readFileSync } from "node:fs";

const RPC = process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org";
async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "f", method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 200));
  return j.result;
}

const wallet = JSON.parse(readFileSync(process.env.E2E_WALLET_FILE || "scripts/.e2e-wallet.json", "utf8"));
const seed = bs58.decode(wallet.secret.replace("ed25519:", ""));
const e2eKp = nacl.sign.keyPair.fromSecretKey(seed);
const e2eAccount = crypto.createHash("sha256").update(Buffer.from(e2eKp.publicKey)).digest("hex");

const FROM = process.argv[2];
const KEY_FILE = process.argv[3];
const AMOUNT = process.argv[4] ?? "1.5";
const key = JSON.parse(readFileSync(KEY_FILE.replace("~", process.env.HOME), "utf8"));
const kp = KeyPair.fromString(key.private_key);

const ak = await rpc("query", { request_type: "view_access_key", finality: "final", account_id: FROM, public_key: kp.getPublicKey().toString() });
const block = await rpc("block", { finality: "final" });
console.log("block height:", block.header.height, "| hash b64:", block.header.hash.slice(0, 10));

const actions = [actionCreators.transfer(BigInt(Number(AMOUNT) * 1e24))];
// near-js v5 signing: encode the tx, sign sha256(bytes), wrap in
// SignedTransaction with the Signature enum.
const { Transaction, SignedTransaction, Signature } = await import("@near-js/transactions");
import { sha256 as nobleSha256 } from "@noble/hashes/sha256";
const tx = new Transaction({
  signerId: FROM,
  publicKey: kp.getPublicKey(),
  nonce: BigInt(ak.nonce) + 1n,
  receiverId: e2eAccount,
  actions,
  blockHash: Buffer.from(block.header.hash, "base64").subarray(0, 32),
});
const message = encodeTransaction(tx);
const hash = nobleSha256(message);
const { signature } = kp.sign(hash);
const signedTx = new SignedTransaction({
  transaction: tx,
  signature: new Signature({ keyType: tx.publicKey.ed25519Key ? 0 : 1, data: signature }),
});
const naj = await import("near-api-js");
const provider = new naj.providers.JsonRpcProvider({ url: process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org" });
const outcome = await provider.sendTransaction(signedTx);
if (outcome.status?.Failure) throw new Error("tx failed: " + JSON.stringify(outcome.status.Failure).slice(0, 200));
console.log("funded", e2eAccount, "| tx", outcome.transaction_outcome.id);
if (outcome.status?.Failure) throw new Error("tx failed: " + JSON.stringify(outcome.status.Failure).slice(0, 200));
console.log("funded", e2eAccount, "tx", outcome.transaction_outcome.id);
