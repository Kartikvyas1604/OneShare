#!/usr/bin/env python3
"""Floorline Monte-Carlo (Agent.md §6.4) — deterministic, no network.

An exact port of the TypeScript engine (app/lib/crash-sim.ts): mulberry32
(bit-exact), Box–Muller normals, median-neutral GBM (no drift term), one
instantaneous shock at step n_steps/3, three arms (naive / static floor /
floor + single-shot de-risk). The same seed produces the same numbers in both
languages — `npm run check:sim` asserts the parity (F-16, ±0.5 pp).

  python3 sim/make_sim.py --shock -45 --paths 10000 --seed 20261112 \
      [--write artifacts/sim-baseline.json]
"""
import argparse
import hashlib
import json
import math
import os

M32 = 0xFFFFFFFF
INT32 = 0x80000000


def mulberry32(seed: int):
    """Bit-exact port of the TS mulberry32 (|0 wraps, imul, unsigned shifts)."""
    state = seed & M32

    def rand():
        nonlocal state
        state = (state + 0x6D2B79F5) & M32
        t = ((state ^ (state >> 15)) * (1 | state)) & M32
        t = (((t + (((t ^ (t >> 7)) * (61 | t)) & M32)) & M32) ^ t) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296.0

    return rand


def simulate(shock_pct=-45.0, n_paths=10_000, n_steps=90, seed=20261112,
             floor_ratio=0.90, de_risk_trigger=0.50, deposit_usd=1_000.0, sigma=0.80):
    """Three arms over n_paths; identical construction to the TS engine."""
    sigma_step = sigma / math.sqrt(n_steps)
    shock_step = n_steps // 3
    rand = mulberry32(seed)
    risk = deposit_usd * (1 - floor_ratio)

    terminals = [[], [], []]
    drawdowns = [[], [], []]

    for _ in range(n_paths):
        s = 1.0
        de_risk_sold = False
        de_risk_cash = 0.0
        peaks = [deposit_usd] * 3
        dds = [0.0] * 3

        for i in range(n_steps):
            u1 = max(rand(), 1e-12)
            u2 = rand()
            z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
            if i == shock_step:
                s *= 1 + shock_pct / 100
            else:
                s *= math.exp(sigma_step * z)

            v_naive = deposit_usd * s
            v_static = deposit_usd * floor_ratio + risk * s
            v_derisk = deposit_usd * floor_ratio + de_risk_cash if de_risk_sold else v_static
            if not de_risk_sold and risk > 0 and s < 1 - de_risk_trigger and i < n_steps - 1:
                de_risk_sold = True
                de_risk_cash = risk * s

            vals = [v_naive, v_static, v_derisk]
            for a in range(3):
                peaks[a] = max(peaks[a], vals[a])
                dds[a] = max(dds[a], (peaks[a] - vals[a]) / peaks[a])

        terminals[0].append(deposit_usd * s)
        terminals[1].append(deposit_usd * floor_ratio + risk * s)
        terminals[2].append(
            deposit_usd * floor_ratio + de_risk_cash if de_risk_sold
            else deposit_usd * floor_ratio + risk * s
        )
        for a in range(3):
            drawdowns[a].append(dds[a])

    def median(xs):
        s = sorted(xs)
        return s[len(s) // 2]

    def percentile(xs, p):
        s = sorted(xs)
        return s[min(len(s) - 1, math.floor(p * len(s)))]

    arms = {}
    names = ["naive", "static_floor", "with_de_risk"]
    for a, name in enumerate(names):
        med = median(terminals[a])
        arms[name] = {
            "median_terminal_usd": round(med * 100) / 100,
            "worst_terminal_usd": round(percentile(terminals[a], 0.01) * 100) / 100,
            "median_loss_pct": round((med / deposit_usd - 1) * 10_000) / 100,
            "median_max_drawdown_pct": round(median(drawdowns[a]) * 10_000) / 100,
        }

    return {
        "meta": {
            "seed": seed, "n_paths": n_paths, "n_steps": n_steps,
            "shock_pct": shock_pct, "floor_ratio": floor_ratio,
            "de_risk_trigger": de_risk_trigger, "sigma": sigma,
            "deposit_usd": deposit_usd,
        },
        "arms": arms,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shock", type=float, default=-45.0)
    ap.add_argument("--paths", type=int, default=10_000)
    ap.add_argument("--steps", type=int, default=90)
    ap.add_argument("--seed", type=int, default=20261112)
    ap.add_argument("--floor", type=float, default=0.90)
    ap.add_argument("--deposit", type=float, default=1_000.0)
    ap.add_argument("--write", type=str, default=None)
    args = ap.parse_args()

    result = simulate(args.shock, args.paths, args.steps, args.seed, args.floor,
                      0.50, args.deposit)
    blob = json.dumps(result, sort_keys=True, indent=2)
    result["sha256"] = hashlib.sha256(blob.encode()).hexdigest()

    print(json.dumps(result, sort_keys=True, indent=2))
    if args.write:
        d = os.path.dirname(args.write)
        if d:
            os.makedirs(d, exist_ok=True)
        with open(args.write, "w") as f:
            f.write(json.dumps(result, sort_keys=True, indent=2) + "\n")


if __name__ == "__main__":
    main()
