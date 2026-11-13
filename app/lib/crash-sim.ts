/**
 * Deterministic three-arm crash simulation — the browser twin of `sim/cppi.py`
 * (Agent.md §6.4). Pure function of (seed, shockPct, params): the same seed
 * produces byte-identical output (NF-03), so the demo numbers always reproduce.
 *
 * GBM dS/S = μ·dt + σ·dW, σ = 0.80 annualized, μ = 0. One instantaneous shock
 * jump at step n_steps // 3, then the path continues.
 *
 * Arms: (a) naive 100% exposure, (b) static floor (reserve escrowed, no
 * de-risk), (c) Floorline with the de-risk rule (single-shot, formula 6).
 */

export const DEFAULT_SEED = 20261112;
export const DEMO_SHOCK_PCT = -45;

export interface CrashArm {
  key: "naive" | "static" | "derisk";
  label: string;
  /** Median terminal value, USD. */
  medianTerminalUsd: number;
  /** 1st-percentile terminal value — the honest "worst case in dollars". */
  worstTerminalUsd: number;
  /** Median loss vs deposit, percent (negative = loss). */
  medianLossPct: number;
  /** Median max drawdown of the arm's value path, percent. */
  medianMaxDrawdownPct: number;
  /** Representative value path (terminal closest to the median), USD, n_steps + 1 points. */
  path: number[];
}

export interface CrashResult {
  shockPct: number;
  seed: number;
  depositUsd: number;
  floorRatio: number;
  deRiskTrigger: number;
  nPaths: number;
  nSteps: number;
  arms: CrashArm[];
}

export interface CrashOptions {
  depositUsd?: number;
  floorRatio?: number;
  deRiskTrigger?: number;
  nPaths?: number;
  nSteps?: number;
  seed?: number;
}

/** mulberry32 — tiny deterministic PRNG; one shared stream keeps runs reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PathSummary {
  terminals: [number, number, number]; // naive, static, derisk
  drawdowns: [number, number, number];
}

/** One pass over nPaths; regenerating with the same seed replays identical paths. */
function summarize(shockPct: number, opts: Required<CrashOptions>): {
  summaries: PathSummary[];
} {
  const { floorRatio, deRiskTrigger, nPaths, nSteps, seed, depositUsd } = opts;
  const sigmaStep = 0.8 / Math.sqrt(nSteps); // σ = 0.80 annualized
  const shockStep = nSteps / 3;
  const rand = mulberry32(seed);

  const summaries: PathSummary[] = [];
  for (let p = 0; p < nPaths; p++) {
    let s = 1;
    // Value paths for the three arms; the de-risk arm tracks sold cash separately.
    let deRiskSold = false;
    let deRiskCash = 0;
    const risk = depositUsd * (1 - floorRatio);
    const peaks: [number, number, number] = [depositUsd, depositUsd, depositUsd];
    const dds: [number, number, number] = [0, 0, 0];

    for (let i = 0; i < nSteps; i++) {
      // Box–Muller normal from two uniforms — deterministic given the stream.
      const u1 = Math.max(rand(), 1e-12);
      const u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      if (i === shockStep) {
        s *= 1 + shockPct / 100;
      } else {
        // Median-neutral GBM step (no Itô drift term): a −45% shock shows a
        // −45% naive median loss, as the demo script states. σ = 0.80 annualized.
        s *= Math.exp(sigmaStep * z);
      }

      const vNaive = depositUsd * s;
      const vStatic = depositUsd * floorRatio + risk * s;
      const vDerisk = deRiskSold
        ? depositUsd * floorRatio + deRiskCash
        : vStatic;
      if (!deRiskSold && risk > 0 && s < 1 - deRiskTrigger && i < nSteps - 1) {
        // Formula (6) in normalized prices: sell the whole bucket, once (I6).
        // Final move excluded so both passes stay in lockstep.
        deRiskSold = true;
        deRiskCash = risk * s;
      }

      const vals: [number, number, number] = [vNaive, vStatic, vDerisk];
      for (let a = 0; a < 3; a++) {
        peaks[a] = Math.max(peaks[a], vals[a]);
        dds[a] = Math.max(dds[a], (peaks[a] - vals[a]) / peaks[a]);
      }
    }

    summaries.push({
      terminals: [
        depositUsd * s,
        depositUsd * floorRatio + risk * s,
        deRiskSold ? depositUsd * floorRatio + deRiskCash : depositUsd * floorRatio + risk * s,
      ],
      drawdowns: dds,
    });
  }
  return { summaries };
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function percentile(xs: number[], p: number): number {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

/** Second pass with the same seed to capture one full representative path per arm. */
function representativePaths(
  shockPct: number,
  opts: Required<CrashOptions>,
  medianTerminals: [number, number, number]
): number[][] {
  const { floorRatio, deRiskTrigger, nPaths, nSteps, seed, depositUsd } = opts;
  const sigmaStep = 0.8 / Math.sqrt(nSteps);
  const shockStep = nSteps / 3;
  const rand = mulberry32(seed);

  const targets = medianTerminals.map(() => ({
    best: Number.POSITIVE_INFINITY,
    path: [] as number[],
  }));
  const risk = depositUsd * (1 - floorRatio);

  for (let p = 0; p < nPaths; p++) {
    let s = 1;
    let deRiskSold = false;
    let deRiskCash = 0;
    const paths: number[][] = [[], [], []];

    for (let i = 0; i <= nSteps; i++) {
      if (i > 0) {
        const u1 = Math.max(rand(), 1e-12);
        const u2 = rand();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        s *= i - 1 === shockStep ? 1 + shockPct / 100 : Math.exp(sigmaStep * z);
      }
      const vNaive = depositUsd * s;
      const vStatic = depositUsd * floorRatio + risk * s;
      const vDerisk = deRiskSold ? depositUsd * floorRatio + deRiskCash : vStatic;
      if (!deRiskSold && risk > 0 && s < 1 - deRiskTrigger && i < nSteps) {
        deRiskSold = true;
        deRiskCash = risk * s;
      }
      paths[0].push(vNaive);
      paths[1].push(vStatic);
      paths[2].push(vDerisk);
    }

    for (let a = 0; a < 3; a++) {
      const d = Math.abs(paths[a][nSteps] - medianTerminals[a]);
      if (d < targets[a].best) {
        targets[a].best = d;
        targets[a].path = paths[a];
      }
    }
    if (targets.every((t) => t.best === 0)) break;
  }
  return targets.map((t) => t.path);
}

export function simulateCrash(shockPct: number, options: CrashOptions = {}): CrashResult {
  const opts: Required<CrashOptions> = {
    depositUsd: options.depositUsd ?? 1_000,
    floorRatio: options.floorRatio ?? 0.9,
    deRiskTrigger: options.deRiskTrigger ?? 0.5,
    nPaths: options.nPaths ?? 10_000,
    nSteps: options.nSteps ?? 90,
    seed: options.seed ?? DEFAULT_SEED,
  };

  const { summaries } = summarize(shockPct, opts);

  const terminalsByArm: [number[], number[], number[]] = [[], [], []];
  const drawdownsByArm: [number[], number[], number[]] = [[], [], []];
  for (const s of summaries) {
    for (let a = 0; a < 3; a++) {
      terminalsByArm[a].push(s.terminals[a]);
      drawdownsByArm[a].push(s.drawdowns[a]);
    }
  }

  const medianTerminals = terminalsByArm.map((xs) => median(xs)) as [number, number, number];
  const paths = representativePaths(shockPct, opts, medianTerminals);

  const labels: CrashArm["key"][] = ["naive", "static", "derisk"];
  const names = ["Naive · 100% exposed", "Static floor · no de-risk", "Floorline · de-risk armed"];

  const arms: CrashArm[] = labels.map((key, a) => {
    const medianTerminal = medianTerminals[a];
    return {
      key,
      label: names[a],
      medianTerminalUsd: Math.round(medianTerminal * 100) / 100,
      worstTerminalUsd: Math.round(percentile(terminalsByArm[a], 0.01) * 100) / 100,
      medianLossPct: Math.round((medianTerminal / opts.depositUsd - 1) * 10_000) / 100,
      medianMaxDrawdownPct: Math.round(median(drawdownsByArm[a]) * 10_000) / 100,
      path: paths[a].map((v) => Math.round(v * 100) / 100),
    };
  });

  return {
    shockPct,
    seed: opts.seed,
    depositUsd: opts.depositUsd,
    floorRatio: opts.floorRatio,
    deRiskTrigger: opts.deRiskTrigger,
    nPaths: opts.nPaths,
    nSteps: opts.nSteps,
    arms,
  };
}
