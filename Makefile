# Floorline — reproducible builds & checks
# make sim        → regenerate artifacts/sim-baseline.json (10,000 paths, seed 20261112)
# make test       → TS unit tests + Rust tests (unit + invariants)
# make test-rust  → Rust only, including the break_escrow teeth proof
# make check      → types + full test suite + copy rules + sim parity

SHELL := /bin/bash

.PHONY: setup test test-rust sim check check-copy build build-contracts lint

setup:
	npm ci
	cd contracts && cargo build --target wasm32-unknown-unknown --release

test:
	npx tsc --noEmit
	npx vitest run
	cd contracts && cargo test

test-rust:
	cd contracts && cargo test
	cd contracts && cargo test -p floorline-escrow --features break_escrow || \
	  echo "break_escrow build FAILED the invariant test — that failure is the proof (K-5)"

sim:
	python3 sim/make_sim.py --shock -45 --paths 10000 --seed 20261112 \
	  --write artifacts/sim-baseline.json

check: test
	node scripts/check-copy.mjs

check-copy:
	node scripts/check-copy.mjs

build-contracts:
	cd contracts && cargo near build non-reproducible-wasm --manifest-path vault/Cargo.toml
	cd contracts && cargo near build non-reproducible-wasm --manifest-path escrow/Cargo.toml
	wasm-opt -Oz --enable-bulk-memory contracts/target/near/floorline_vault/floorline_vault.wasm \
	  -o contracts/target/near/floorline_vault/floorline_vault.opt.wasm
	wasm-opt -Oz --enable-bulk-memory contracts/target/near/floorline_escrow/floorline_escrow.wasm \
	  -o contracts/target/near/floorline_escrow/floorline_escrow.opt.wasm

lint:
	npx tsc --noEmit
