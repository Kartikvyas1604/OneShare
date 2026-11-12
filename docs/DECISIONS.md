# DECISIONS

Log per spec §0.4: date · ambiguity · choice · reason. Newest last.

- 2026-11-12 · Product name in the UI · **Floorline** · `agent/Agent.md` is the single source of truth and names the combined product Floorline (§18); OneShare was the pre-merge working name. `APP_CONFIG.name` and all UI strings follow.
- 2026-11-12 · `/create` slider label ("loss limit 50–98%, step 1%") vs `floor_ratio_bps` range (5_000..9_800, step 100) · **Slider value is the floor/reserve share, labelled "Loss limit", with the derived max-loss % (100% − floor) shown beside it** · The spec's UI range matches the floor-ratio range exactly; both readings stay true on screen.
- 2026-11-12 · Position identifiers in URLs · **Opaque hex ids (`/vault/0x…`) with a numeric fallback resolver** · On-chain `token_id` is a numeric u64 (§4.1); hex keeps URLs non-enumerable and matches the already-shipped routing.
- 2026-11-12 · Demo risk asset · **wNEAR via the verified 1Click fallback (`fallback-near`)** · G-2 requires the demo to not depend on the equity route; NVDAon/NVDAx candidates are shown but marked unverified.
- 2026-11-12 · NAV on the web · **Computed client-side from the current mock price (f64, display-only)** · §4.5 permits f64 for display; `nav_quote` remains persisted on-chain in the contract.
- 2026-11-12 · Crash simulator backend · **Deterministic three-arm Monte-Carlo runs in the browser with the same params and seed (20261112) as `sim/make_sim.py`; "Replay recorded run" serves the cached −45% result** · Zero-network demo per §11 fallback (2); the keeper's `POST /v1/crash-sim` stays authoritative for the recorded run.
- 2026-11-12 · `/vault/[id]` events feed · **Kept a compact contract-event log on the page** · Not listed in §6.5 but supports the demo line "here is the escrow, and here is the test"; events use the exact §6.2 event names.
- 2026-11-13 · Crash-sim GBM discretization · **Median-neutral step `exp(σ√dt·z)` (no Itô drift term)** · The canonical `exp((μ−0.5σ²)dt+σ√dt·z)` shows a −27% median loss at a 0% shock; the demo script (§11) states "A 45% crash. Naive loses 45%" — median-neutral makes that literally true. Python `sim/cppi.py` will match.
- 2026-11-13 · Positions minted from `/create` · **Ephemeral in-memory session store resolved client-side on `/vault/[id]`** · Satisfies the E2E flow (§10: `/create` → deposit → `/vault/[id]` shows the NFT) without hydration risk or URL state; fixtures stay the source for the recorded demo.
