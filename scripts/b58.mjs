// Base58 encode/decode — bitcoin semantics (leading 1s = zero bytes).
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function enc58(buf) {
  const zeros = countLeadingZeros(buf);
  let n = BigInt("0x" + buf.subarray(zeros).toString("hex"));
  let out = "";
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  return "1".repeat(zeros) + out;
}

export function dec58exact(s, len) {
  const leadOnes = (s.match(/^1+/) || [""])[0].length;
  let n = 0n;
  for (const c of s.slice(leadOnes)) n = n * 58n + BigInt(B58.indexOf(c));
  const bits = n === 0n ? 0 : n.toString(2).length;
  const byteLen = Math.max(0, Math.ceil(bits / 8) - leadOnes);
  if (byteLen > len) throw new Error(`base58 value needs ${byteLen} bytes, expected ${len}`);
  const hex = n.toString(16).padStart(Math.ceil(bits / 8) * 2, "0");
  return Buffer.concat([Buffer.alloc(leadOnes), Buffer.from(hex, "hex")]);
}

function countLeadingZeros(bytes) {
  let z = 0;
  while (z < bytes.length && bytes[z] === 0) z++;
  return z;
}
