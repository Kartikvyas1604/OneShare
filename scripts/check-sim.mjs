#!/usr/bin/env node
/**
 * check-sim.mjs — F-16 parity: the TypeScript engine vs the Python engine.
 * Same seed (20261112), same construction; arm medians must agree within
 * ±0.5 percentage points. Also writes artifacts/sim-baseline.json (the TS
 * engine is the demo engine; the python one is the reproducible artifact).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { simulateCrash } from "../app/lib/crash-sim.ts"; // vitest resolves TS; for node use the compiled lib
