#!/usr/bin/env node
/**
 * check-copy.mjs — the banned-words rule (§0.5) + the asset-name rule (U2).
 * Exits 1 with the offending file:line list on any hit.
 */
import { execFileSync } from "node:child_process";

const banned =
  /revolutionary|game.changing|disrupting|seamless(ly)? |world.class|next.gen|guaranteed|risk.free|principal protected|passive income|to the moon|safe returns|you cannot lose/i;

// Asset names may appear ONLY inside the roadmap paragraph (U2).
const assetAllowedFiles = [/docs\/DECISIONS\.md/, /docs\/AGENT_POLICY\.md/, /docs\/ONCHAIN-TRAIL\.md/, /artifacts\//];

function grep(pattern, args) {
  try {
    return execFileSync("grep", ["-rEn", pattern, ...args], { encoding: "utf8" });
  } catch (e) {
    return ""; // no matches → grep exits 1
  }
}

let bad = [];

const bannedHits = grep(banned.source, ["README.md", "app/", "docs/", "scripts/", "sim/", "--exclude=check-copy.mjs"]);
if (bannedHits) bad.push(...bannedHits.split("\n").filter(Boolean).map((l) => `banned-word: ${l}`));

const assetHits = grep("NVIDIA|NVDAon|TSLAON", ["README.md", "app/", "docs/", "scripts/", "--exclude=check-copy.mjs"]);
if (assetHits) {
  for (const line of assetHits.split("\n").filter(Boolean)) {
    const allowed = assetAllowedFiles.some((re) => re.test(line));
    if (!allowed) bad.push(`asset-name outside the roadmap: ${line}`);
  }
}

if (bad.length) {
  console.error("check-copy FAILED:");
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log("check-copy OK: no banned words, asset names only where allowed");
