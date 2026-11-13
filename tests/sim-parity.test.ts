import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { simulateCrash } from "@/app/lib/crash-sim";

/** F-16: the web engine and the deterministic python sim agree (±0.5 pp). */
describe("sim parity: TypeScript engine vs python engine (seed 20261112)", () => {
  const SHOCK = -45;
  const PATHS = 2_000; // parity run size; `make sim` regenerates 10,000
  const SEED = 20261112;

  const ts = simulateCrash(SHOCK, { nPaths: PATHS, nSteps: 90, seed: SEED, depositUsd: 1_000 });
  const py = JSON.parse(
    execFileSync(
      "python3",
      ["sim/make_sim.py", "--shock", String(SHOCK), "--paths", String(PATHS), "--seed", String(SEED)],
      { encoding: "utf8", timeout: 120_000 }
    )
  );

  const tsArm = (name: string) => {
    const arms = ts.arms as Array<{ key: string; medianLossPct: number }>;
    const a = arms.find((x) => x.key === name);
    if (!a) throw new Error(`missing TS arm ${name}`);
    return a.medianLossPct;
  };
  const pyArm = (name: string) => py.arms[name].median_loss_pct;

  it("naive arm parity", () => {
    expect(Math.abs(tsArm("naive") - pyArm("naive"))).toBeLessThanOrEqual(0.5);
  });
  it("static floor arm parity", () => {
    expect(Math.abs(tsArm("static") - pyArm("static_floor"))).toBeLessThanOrEqual(0.5);
  });
  it("de-risk arm parity", () => {
    expect(Math.abs(tsArm("derisk") - pyArm("with_de_risk"))).toBeLessThanOrEqual(0.5);
  });
  it("the −45% naive median reads ≈ −45% (demo-script claim)", () => {
    expect(Math.abs(pyArm("naive") + 45)).toBeLessThan(3);
  });
});
