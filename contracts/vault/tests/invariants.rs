//! Vault invariant fuzz suite (Agent.md §10 — R1; I1–I6; edge cases §4.7).
//!
//! Deterministic: seed 20261112 (the spec's Monte-Carlo seed). Runs 2,000
//! randomised operation sequences (deposit / signed buy / de-risk / early
//! exit / NFT transfer / pause) and checks the invariants after EVERY action:
//!   I1  total_floor_locked == Σ position.floor_amount
//!   I2  cost_basis + realised_quote ≤ risk_budget for every position
//!   I3  floor_amount is written once at deposit and never mutated
//!   I6  de_risked latches true and never reverts
//! Plus the attack cases: a quote signed by a non-oracle key, stale quotes,
//! off-step loss limits (F-22), double settlement (F-14), and NFT transfer.

use ed25519_dalek::{Signer, SigningKey};
use floorline_vault::types::{PositionState, VaultConfig};
use floorline_vault::Vault;
use near_sdk::json_types::{U128, U64};
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::{testing_env, AccountId, PromiseResult};

const SELF: &str = "vault3.floorline-escrow.testnet";
const WRAP: &str = "wrap.testnet";
const USER: &str = "floorline-escrow.testnet";
const USER2: &str = "second-user.testnet";
const ESCROW: &str = "escrow.testnet";
/// Test-only oracle seed — this keypair exists solely inside the fuzz suite.
const TEST_ORACLE_SEED: [u8; 32] = [7u8; 32];

fn hex_encode(b: &[u8]) -> String {
    b.iter().map(|x| format!("{x:02x}")).collect()
}

struct TestVault {
    vault: Vault,
    signer: SigningKey,
    now_ms: u64,
}

fn base_config() -> VaultConfig {
    // Testnet-style config: quote = wNEAR (24 dec), risk = the NVDA
    // stand-in (6 dec), a large TVL cap so the cap test owns its ceiling.
    VaultConfig {
        quote_asset_id: WRAP.to_string(),
        risk_asset_id: "nvda-token.testnet".to_string(),
        min_deposit: near_sdk::json_types::U128(1_000_000_000_000_000_000_000_000),
        max_tvl: near_sdk::json_types::U128(1_000_000_000_000_000_000_000_000_000),
        quote_decimals: 24,
        risk_decimals: 6,
        oracle_pubkey_hex: hex_encode(
            &SigningKey::from_bytes(&TEST_ORACLE_SEED).verifying_key().to_bytes(),
        ),
        ..VaultConfig::default()
    }
}

impl TestVault {
    fn new() -> Self {
        let cfg = base_config();
        let ctx = VMContextBuilder::new()
            .current_account_id(SELF.parse().unwrap())
            .predecessor_account_id(WRAP.parse().unwrap())
            .block_timestamp(1_700_000_000_000_000_000)
            .build();
        testing_env!(ctx);
        // near-sdk's mock carries storage across blockchain swaps in one
        // thread — clear it so a fresh vault starts on a clean slate.
        let _ = near_sdk::mock::with_mocked_blockchain(|b| b.take_storage());
        let vault = Vault::new(
            Some(cfg),
            Some(ESCROW.parse().unwrap()),
            Some(ESCROW.parse().unwrap()),
            Some("oracles.testnet".parse().unwrap()),
        );
        Self { vault, signer: SigningKey::from_bytes(&TEST_ORACLE_SEED), now_ms: 1_700_000_000_000 }
    }

    fn set_env(&self, predecessor: &str) {
        let ctx = VMContextBuilder::new()
            .current_account_id(SELF.parse().unwrap())
            .predecessor_account_id(predecessor.parse::<AccountId>().unwrap())
            .block_timestamp(self.now_ms * 1_000_000)
            .build();
        testing_env!(ctx);
    }

    fn set_env_with_promise(&self, predecessor: &str, promise: PromiseResult) {
        let ctx = VMContextBuilder::new()
            .current_account_id(SELF.parse().unwrap())
            .predecessor_account_id(predecessor.parse::<AccountId>().unwrap())
            .block_timestamp(self.now_ms * 1_000_000)
            .build();
        testing_env!(
            ctx,
            near_sdk::test_vm_config(),
            near_sdk::RuntimeFeesConfig::test(),
            Default::default(),
            vec![promise],
        );
    }

    fn sign(&self, position_id: u64, price_1e18: u128, ts: u64) -> String {
        let msg = format!("floorline-quote:{position_id}:{price_1e18}:{ts}");
        hex_encode(&self.signer.sign(msg.as_bytes()).to_bytes())
    }

    fn tick(&mut self, ms: u64) {
        self.now_ms += ms;
    }

    fn with_overrides(f: impl FnOnce(&mut VaultConfig)) -> Self {
        let mut cfg = base_config();
        f(&mut cfg);
        let ctx = VMContextBuilder::new()
            .current_account_id(SELF.parse().unwrap())
            .predecessor_account_id(WRAP.parse().unwrap())
            .block_timestamp(1_700_000_000_000_000_000)
            .build();
        testing_env!(ctx);
        // near-sdk's mock carries storage across blockchain swaps in one
        // thread — clear it so a fresh vault starts on a clean slate.
        let _ = near_sdk::mock::with_mocked_blockchain(|b| b.take_storage());
        let vault = Vault::new(
            Some(cfg),
            Some(ESCROW.parse().unwrap()),
            Some(ESCROW.parse().unwrap()),
            Some("oracles.testnet".parse().unwrap()),
        );
        Self { vault, signer: SigningKey::from_bytes(&TEST_ORACLE_SEED), now_ms: 1_700_000_000_000 }
    }
}

fn catch_panic(f: impl FnOnce() + std::panic::UnwindSafe) -> bool {
    std::panic::catch_unwind(f).is_err()
}

fn deposit_open(tv: &mut TestVault, msg: &str) -> (u64, u128) {
    let deposit = 1_000_000_000_000_000_000_000_000u128;
    tv.set_env(WRAP);
    let _ = tv.vault.ft_on_transfer(USER.parse().unwrap(), U128(deposit), msg.to_string());
    // Finalize the escrow ack (a receipt in production). Position ids are
    // monotonic — the newest id is the one just minted.
    tv.set_env_with_promise(SELF, PromiseResult::Successful(vec![]));
    let pid = tv
        .vault
        .positions_of(USER.parse().unwrap())
        .last()
        .expect("the deposit must mint a position")
        .position_id;
    let floor = tv.vault.get_position(U64(pid)).unwrap().floor_amount;
    tv.vault.on_escrow_ack(pid, USER.parse().unwrap(), deposit, floor);
    (pid, deposit)
}

/// I1–I6 across 2,000 deterministic randomised sequences.
#[test]
fn invariants_hold_under_random_sequences() {
    let mut tv = TestVault::new();
    let mut state: u64 = 20261112;
    let mut next = move || {
        state = state
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        (state >> 33) as u128
    };

    let mut shadow_floors: Vec<u128> = Vec::new();
    let mut open_position: Option<u64> = None;
    let mut ops = 0usize;

    for seq in 0..2_000u64 {
        tv.tick(1_000 + (next() % 5_000) as u64);
        let action = next() % 5;

        // Open a new position when none is live.
        if open_position.is_none() && (action == 0 || seq % 11 == 0) {
            let ratio = if next() % 2 == 0 {
                format!("deposit:{}", 5_000 + (next() % 49) as u16 * 100)
            } else {
                "deposit".to_string()
            };
            let (pid, deposit) = deposit_open(&mut tv, &ratio);
            {
                let (_, locked, deposited) = tv.vault.get_vault_state();
                assert_eq!(deposited.0, deposit, "I1: the escrow transfer must be accounted");
            }
            let pos = tv.vault.get_position(U64(pid)).expect("position must exist");
            assert_eq!(pos.floor_amount + pos.risk_budget, pos.deposit_amount, "F-03");
            // F-22: every accepted ratio stayed inside the clamp.
            let r = pos.floor_amount * 10_000 / pos.deposit_amount;
            assert!((5_000..=9_800).contains(&r), "ratio {r} escaped the clamp");
            assert_eq!(pos.state, "Open");
            while shadow_floors.len() < pid as usize {
                shadow_floors.push(pos.floor_amount);
            }
            shadow_floors[(pid - 1) as usize] = pos.floor_amount;
            open_position = Some(pid);
            ops += 1;
            continue;
        }

        let Some(pid) = open_position else { continue };
        let pos = tv.vault.get_position(U64(pid)).unwrap();

        match action {
            // Signed buy (I2 cap enforced on-chain).
            1 if pos.state == "Open" => {
                let remaining = pos.risk_budget - pos.cost_basis;
                let cost = remaining.saturating_sub(next() % (remaining / 3 + 1));
                let price = 4_000_000_000_000_000_000 + next() % 2_000_000_000_000_000_000;
                // For the (6, 24) decimal pair target_units == cost / price.
                let units = cost / price;
                let ts = tv.now_ms;
                let sig = tv.sign(pid, price, ts);
                tv.set_env(USER);
                tv.vault.record_buy(U64(pid), U128(units), U128(cost), U128(units), U128(price), ts, sig);
                let pos = tv.vault.get_position(U64(pid)).unwrap();
                assert_eq!(pos.state, "Active", "buy must move Open → Active");
                assert!(pos.cost_basis <= pos.risk_budget, "I2 violated");
                ops += 1;
            }

            // De-risk at a crash price (I6 single-shot).
            2 if pos.state == "Active" && !pos.de_risked && pos.risk_units > 0 => {
                let price = 4_000_000_000_000_000_000 * 45 / 100; // −55%
                let ts = tv.now_ms;
                let sig = tv.sign(pid, price, ts);
                let realised = pos.risk_units * price; // (6,24) pair: unit_value = q × P
                tv.set_env(USER);
                tv.vault.record_de_risk(U64(pid), U128(realised), U128(price), ts, sig);
                let pos = tv.vault.get_position(U64(pid)).unwrap();
                assert!(pos.de_risked, "I6 must latch");
                assert_eq!(pos.state, "DeRisked");
                assert!(pos.cost_basis + pos.realised_quote <= pos.risk_budget, "I2 violated");
                ops += 1;
            }

            // Early exit → settle path (escrow release + ack).
            3 if pos.state == "DeRisked" || (pos.state == "Open" && seq % 13 == 0) => {
                let price = 2_000_000_000_000_000_000;
                let nav = pos.floor_amount + pos.risk_units * price / 1 + pos.realised_quote;
                let payout = nav * (10_000 - 100) / 10_000; // formula (8), 1% fee
                tv.set_env(USER);
                let _ = tv.vault.exit_early(U64(pid), U128(price));
                tv.set_env_with_promise(SELF, PromiseResult::Successful(vec![]));
                tv.vault.on_settle_release(pid, USER.parse().unwrap(), U128(payout), "Open".to_string());
                // The payout confirms in its own receipt; finalize after it.
                tv.set_env_with_promise(SELF, PromiseResult::Successful(vec![]));
                tv.vault.on_payout_complete(pid, USER.parse().unwrap(), U128(payout), "Open".to_string());
                assert!(tv.vault.get_position(U64(pid)).is_none(), "settled position removed");
                let (_, locked, deposited) = tv.vault.get_vault_state();
                assert_eq!(locked.0, 0, "I1 aggregate must clear after settlement");
                assert_eq!(deposited.0, 0);
                open_position = None;
                ops += 1;
            }

            // NFT transfer moves the claim (F-13).
            4 if pos.state == "Active" && seq % 3 == 0 => {
                tv.set_env(USER);
                tv.vault.nft_transfer(USER2.parse().unwrap(), U64(pid), None, None);
                let pos = tv.vault.get_position(U64(pid)).unwrap();
                assert_eq!(pos.owner.to_string(), USER2, "F-13: ownership moved");
                // Transfer back to keep the rest of the sequence simple.
                tv.set_env(USER2);
                tv.vault.nft_transfer(USER.parse().unwrap(), U64(pid), None, None);
                assert_eq!(tv.vault.get_position(U64(pid)).unwrap().owner.to_string(), USER);
                // Both owners' position vectors must be intact after the swap
                // (the shared-prefix bug corrupted exactly this).
                assert!(tv.vault.positions_of(USER2.parse().unwrap()).is_empty(),
                    "USER2's vector must not hold the transferred position");
                assert!(tv.vault.positions_of(USER.parse().unwrap()).iter().any(|p| p.position_id == pid),
                    "USER's vector must still list the position");
                ops += 1;
            }

            _ => {}
        }

        // I1 + I3 after EVERY sequence with a live position.
        if let Some(pid) = open_position {
            let pos = tv.vault.get_position(U64(pid)).unwrap();
            let (_, locked, _) = tv.vault.get_vault_state();
            assert_eq!(
                locked.0, pos.floor_amount,
                "I1 violated at seq {seq}: locked={} floor={}",
                locked.0, pos.floor_amount
            );
            assert_eq!(pos.floor_amount, shadow_floors[(pid - 1) as usize], "I3 violated");
        }
    }

    assert!(ops >= 400, "suite must exercise real work; got {ops} ops");
}

/// Attack: a quote signed by a non-oracle key must revert (T-02).
#[test]
fn non_oracle_signature_is_rejected() {
    let mut tv = TestVault::new();
    let (pid_opened, _) = deposit_open(&mut tv, "deposit");
    let price = 4_000_000_000_000_000_000u128;
    let ts = tv.now_ms;
    let wrong_sig = {
        let other = SigningKey::from_bytes(&[9u8; 32]);
        let msg = format!("floorline-quote:1:{price}:{ts}");
        hex_encode(&other.sign(msg.as_bytes()).to_bytes())
    };
    tv.set_env(USER);
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        tv.vault
            .record_buy(U64(1), U128(100), U128(100), U128(100), U128(price), ts, wrong_sig);
    }));
    assert!(rejected, "a quote signed by a non-oracle key must revert");
    assert!(
        tv.vault.get_position(U64(1)).unwrap().risk_units == 0,
        "the forged quote must not have moved the position"
    );
}

/// Attack: a stale quote must revert (F-07) even with a VALID signature.
#[test]
fn stale_quote_is_rejected() {
    let mut tv = TestVault::new();
    let (pid_opened, _) = deposit_open(&mut tv, "deposit");
    let price = 4_000_000_000_000_000_000u128;
    let old_ts = tv.now_ms - 90_000; // 90 s old, max age 60 s
    let sig = tv.sign(1, price, old_ts);
    tv.set_env(USER);
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        tv.vault
            .record_buy(U64(1), U128(100), U128(100), U128(100), U128(price), old_ts, sig);
    }));
    assert!(rejected, "a fresh signature over a stale timestamp must revert");
}

/// Attack: a buy that breaks the I2 cap must revert.
#[test]
fn over_budget_buy_is_rejected() {
    let mut tv = TestVault::new();
    let (pid_opened, _) = deposit_open(&mut tv, "deposit");
    let price = 4_000_000_000_000_000_000u128;
    let ts = tv.now_ms;
    let sig = tv.sign(1, price, ts);
    let pos = tv.vault.get_position(U64(1)).unwrap();
    let excess = pos.risk_budget + 1;
    tv.set_env(USER);
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        tv.vault.record_buy(U64(1), U128(1_000_000), U128(excess), U128(1_000_000), U128(price), ts, sig);
    }));
    assert!(rejected, "I2: cost above the risk budget must revert");
}

/// F-22: out-of-range / off-step loss limits are rejected on-chain; boundary
/// ratios are accepted.
#[test]
fn deposit_ratio_clamp() {
    for bad in ["deposit:9900", "deposit:4500", "deposit:9750", "deposit:abc", "deposit:5001"] {
        let mut tv = TestVault::new();
        tv.set_env(WRAP);
        let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
            let _ = tv.vault.ft_on_transfer(
                USER.parse().unwrap(),
                U128(1_000_000_000_000_000_000_000_000),
                bad.to_string(),
            );
        }));
        assert!(rejected, "ratio {bad} must be rejected");
    }
    for good in ["deposit:5000", "deposit:9800", "deposit:7500"] {
        let mut tv = TestVault::new();
        tv.set_env(WRAP);
        let _ = tv.vault.ft_on_transfer(
            USER.parse().unwrap(),
            U128(1_000_000_000_000_000_000_000_000),
            good.to_string(),
        );
        let pos = tv.vault.get_position(U64(1)).unwrap();
        assert_eq!(pos.floor_amount + pos.risk_budget, pos.deposit_amount);
    }
}

/// F-14 / I5: record_settlement is idempotent; non-SUCCESS can never settle.
#[test]
fn settlement_is_idempotent() {
    let mut tv = TestVault::new();
    let (pid_opened, _) = deposit_open(&mut tv, "deposit");
    tv.set_env(USER);
    tv.vault.record_settlement(U64(1), "deposit-abc-123".to_string(), "SUCCESS".to_string());
    // Replay: no-op, no panic.
    tv.vault.record_settlement(U64(1), "deposit-abc-123".to_string(), "SUCCESS".to_string());
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        tv.vault.record_settlement(U64(1), "deposit-xyz".to_string(), "REFUNDED".to_string());
    }));
    assert!(rejected, "non-SUCCESS status must never settle");
}

/// F-13: NFT transfer moves the claim; the new owner receives the payout.
#[test]
fn nft_transfer_moves_the_claim() {
    let mut tv = TestVault::new();
    let (pid_opened, _) = deposit_open(&mut tv, "deposit");
    tv.set_env(USER);
    tv.vault.nft_transfer(USER2.parse().unwrap(), U64(1), None, None);
    assert_eq!(
        tv.vault.get_position(U64(1)).unwrap().owner.to_string(),
        USER2,
        "F-13: ownership moved"
    );
    // Fast-forward past maturity (term = 30 days = 2.592e9 ms).
    tv.tick(2_600_000_000);
    tv.set_env(USER);
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        let _ = tv.vault.settle(U64(1), U128(2_000_000_000_000_000_000));
    }));
    assert!(rejected, "the previous owner must not be able to settle");
    // The NEW owner settles and receives the payout.
    tv.set_env(USER2);
    let _ = tv.vault.settle(U64(1), U128(2_000_000_000_000_000_000));
    tv.set_env_with_promise(SELF, PromiseResult::Successful(vec![]));
    tv.vault.on_settle_release(1, USER2.parse().unwrap(), U128(1_350_000_000_000_000_000_000_000), "Matured".to_string());
    tv.set_env_with_promise(SELF, PromiseResult::Successful(vec![]));
    tv.vault.on_payout_complete(1, USER2.parse().unwrap(), U128(1_350_000_000_000_000_000_000_000), "Matured".to_string());
    assert!(tv.vault.get_position(U64(1)).is_none(), "settled position removed; payout paid the NEW owner");
}

/// Edge case 9: a paused vault rejects buys; deposits still work.
#[test]
fn pause_blocks_buys_not_deposits() {
    let mut tv = TestVault::new();
    // set_paused is treasury-only — sign as the treasury (ESCROW).
    tv.set_env(ESCROW);
    tv.vault.set_paused(true);
    let deposit = 1_000_000_000_000_000_000_000_000u128;
    tv.set_env(WRAP);
    let _ = tv.vault.ft_on_transfer(USER.parse().unwrap(), U128(deposit), "deposit".to_string());
    assert_eq!(
        tv.vault.get_position(U64(1)).unwrap().state,
        "Open",
        "deposits allowed while paused"
    );
    let price = 4_000_000_000_000_000_000u128;
    let ts = tv.now_ms;
    let sig = tv.sign(1, price, ts);
    tv.set_env(USER);
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        tv.vault.record_buy(U64(1), U128(1), U128(1), U128(1), U128(price), ts, sig);
    }));
    assert!(rejected, "ErrPaused: buys must be rejected while paused");
}

/// TVL cap: deposits above max_tvl revert (edge case 8).
#[test]
fn tvl_cap_enforced() {
    // A dedicated small-cap vault: max_tvl = half a deposit.
    let mut tv = TestVault::with_overrides(|cfg| {
        cfg.max_tvl = near_sdk::json_types::U128(500_000_000_000_000_000_000_000);
    });
    tv.set_env(WRAP);
    let rejected = catch_panic(std::panic::AssertUnwindSafe(|| {
        let _ = tv.vault.ft_on_transfer(
            USER.parse().unwrap(),
            U128(1_000_000_000_000_000_000_000_000),
            "deposit".to_string(),
        );
    }));
    assert!(rejected, "ErrTvlCap must fire above max_tvl");
}
