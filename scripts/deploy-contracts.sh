#!/usr/bin/env bash
# Floorline contract deployment (testnet first, then mainnet).
#
# Prerequisites:
#   1. The `near` CLI (cargo install near-cli-rs, or the JS near CLI via
#      `npm i -g near`).
#   2. A funded NEAR account whose key is in the local keychain
#      (`near login`) or provided via NEAR_PRIVATE_KEY.
#   3. The built artifacts (cd contracts && cargo build --target
#      wasm32-unknown-unknown --release -p floorline-escrow -p floorline-vault
#      && wasm-opt -Oz ...).
#
# Usage:  ./scripts/deploy-contracts.sh <network: testnet|mainnet> <vault-account> <escrow-account>
# Example: ./scripts/deploy-contracts.sh testnet floorline-demo.testnet floor.vault-demo.testnet
set -euo pipefail

NETWORK="${1:?usage: deploy-contracts.sh <testnet|mainnet> <vault-account> <escrow-account>}"
VAULT_ACCOUNT="${2:?missing vault account id}"
ESCROW_ACCOUNT="${3:?missing escrow account id}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

VAULT_WASM="${ROOT}/contracts/target/wasm32-unknown-unknown/release/floorline_vault.opt.wasm"
ESCROW_WASM="${ROOT}/contracts/target/wasm32-unknown-unknown/release/floorline_escrow.opt.wasm"

for f in "$VAULT_WASM" "$ESCROW_WASM"; do
  [ -f "$f" ] || { echo "missing artifact: $f — build with wasm-opt -Oz first"; exit 1; }
done

if ! command -v near >/dev/null 2>&1; then
  echo "the near CLI is required: cargo install near-cli-rs (or npm i -g near)"
  exit 1
fi

echo "== 1/4 create + deploy the ESCROW at ${ESCROW_ACCOUNT} (${NETWORK}) =="
near create-account "$ESCROW_ACCOUNT" --masterAccount "$VAULT_ACCOUNT" --network "$NETWORK" 2>/dev/null || \
  echo "(account may already exist — continuing)"
near deploy "$ESCROW_ACCOUNT" "$ESCROW_WASM" --network "$NETWORK"
near call "$ESCROW_ACCOUNT" new \
  '{"vault": "'"$VAULT_ACCOUNT"'", "quote_asset": "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"}' \
  --accountId "$ESCROW_ACCOUNT" --network "$NETWORK"

echo "== 2/4 deploy the VAULT at ${VAULT_ACCOUNT} (${NETWORK}) =="
near deploy "$VAULT_ACCOUNT" "$VAULT_WASM" --network "$NETWORK"
near call "$VAULT_ACCOUNT" new \
  '{"escrow_account": "'"$ESCROW_ACCOUNT"'", "treasury": "'"$VAULT_ACCOUNT"'", "secondary_oracle": "oracles.near"}' \
  --accountId "$VAULT_ACCOUNT" --network "$NETWORK"

echo "== 3/4 smoke the views =="
near view "$VAULT_ACCOUNT" get_config
near view "$ESCROW_ACCOUNT" locked

echo "== 4/4 done =="
echo "set in the web .env.local:"
echo "  VAULT_CONTRACT_ID=${VAULT_ACCOUNT}"
echo "then restart the server — positions read real chain state immediately."
