#!/usr/bin/env node
// Key tooling: exact base58 (bs58 semantics) + ed25519 helpers.
import { generateKeyPairSync, createPrivateKey, createPublicKey } from "node:crypto";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function countLeadingZeros(bytes) {
  let z = 0;
  while (z < bytes.length && bytes[z] === 0) z++;
  return z;
}

function enc58exact(bytes) {
  const zeros = countLeadingZeros(bytes);
  let n = BigInt("0x" + bytes.subarray(zeros).toString("hex"));
  let out = "";
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  return "1".repeat(zeros) + out;
}

function dec58exact(s) {
  const leadOnes = (s.match(/^1+/) || [""])[0].length;
  let n = 0n;
  for (const c of s.slice(leadOnes)) n = n * 58n + BigInt(B58.indexOf(c));
  const bits = n === 0n ? 0 : n.toString(2).length;
  const byteLen = Math.max(0, Math.ceil(bits / 8) - leadOnes);
  if (byteLen < 0) throw new Error("negative");
  const hex = n.toString(16).padStart(Math.ceil(bits / 8) * 2, "0");
  return Buffer.concat([Buffer.alloc(leadOnes), Buffer.from(hex, "hex")]);
}

function parsesTo64(secret64) {
  const s = enc58exact(secret64);
  const back = dec58exact(s);
  return back.length === 64 && back.equals(secret64);
}

function seedToKeyPair(seed32) {
  if (seed32.length !== 32) {
    throw new Error("seed must be 32 bytes, got " + seed32.length + ": " + seed32.toString("hex"));
  }
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    seed32,
  ]);
  const priv = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const pub = createPublicKey(priv);
  const pubRaw = pub.export({ type: "spki", format: "der" }).subarray(12);
  return { privRaw: seed32, pubRaw };
}

const cmd = process.argv[2];

if (cmd === "check") {
  // check <account-id> <seed58-or-secret58> <pub58>
  const [, , , account, key58, pub58] = process.argv;
  const seed = dec58exact(key58.replace("ed25519:", ""));
  const kp = seedToKeyPair(seed.length === 32 ? seed : seed.subarray(0, 32));
  const derived = enc58exact(kp.pubRaw);
  console.log("derived pub matches on-chain:", derived === pub58.replace("ed25519:", ""));
  const secret64 = Buffer.concat([kp.privRaw, kp.pubRaw]);
  console.log("parses to exactly 64 bytes:", parsesTo64(secret64));
  console.log("secret64=ed25519:" + enc58exact(secret64));
} else if (cmd === "gen") {
  // gen — rejection-sample a keypair whose secret64 parses to exactly 64 bytes
  let tries = 0;
  while (tries < 2000) {
    tries++;
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const pubRaw = publicKey.export({ type: "spki", format: "der" }).subarray(12);
    const privRaw = privateKey.export({ type: "pkcs8", format: "der" }).subarray(16);
    const secret64 = Buffer.concat([privRaw, pubRaw]);
    if (parsesTo64(secret64)) {
      const seed = privRaw;
      const kp = seedToKeyPair(seed);
      console.log("tries:", tries);
      console.log("PUB=ed25519:" + enc58exact(pubRaw));
      console.log("SECRET64=ed25519:" + enc58exact(secret64));
      break;
    }
  }
} else if (cmd === "derive") {
  // derive <seed58> — verify a seed matches its public key
  const seed = dec58exact(process.argv[3]);
  const kp = seedToKeyPair(seed);
  console.log("PUB=ed25519:" + enc58exact(kp.pubRaw));
}
