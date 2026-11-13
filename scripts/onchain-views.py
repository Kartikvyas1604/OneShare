#!/usr/bin/env python3
"""View calls against the deployed Floorline contracts on testnet."""
import sys, json, base64, urllib.request

RPC = "https://rpc.testnet.near.org"

def call(contract, method, args=b""):
    body = json.dumps({
        "jsonrpc": "2.0", "id": "1", "method": "query",
        "params": {"request_type": "call_function", "finality": "final",
                   "account_id": contract, "method_name": method,
                   "args_base64": base64.b64encode(args).decode()},
    }).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    # NEAR returns the result as a list of byte values.
    raw = bytes(d["result"]["result"]).decode()
    return json.loads(raw)

if __name__ == "__main__":
    cfg = call("vault3.floorline-escrow.testnet", "get_config")
    print("vault config on-chain:")
    print("  quote asset:", cfg["quote_asset_id"])
    print("  risk asset:", cfg["risk_asset_id"])
    print("  floor ratio:", cfg["floor_ratio_bps"], "bps · de-risk trigger:", cfg["de_risk_trigger_bps"], "bps")
    print("  min deposit:", cfg["min_deposit"], "· early-exit fee:", cfg["early_exit_fee_bps"], "bps")
    state = call("vault3.floorline-escrow.testnet", "get_vault_state")
    print("vault state [paused, floor_locked, total_deposited]:", state)
    print("escrow locked:", call("floorline-escrow.testnet", "locked"))
    print("positions:", call("vault3.floorline-escrow.testnet", "positions_of", json.dumps({"account_id": "floorline-escrow.testnet"}).encode()))
