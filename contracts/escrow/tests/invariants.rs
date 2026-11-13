//! Escrow invariant suite (Agent.md §10, R1, K-5).
//!
//! The escrow's `release` is the ONLY door to the reserve. This suite proves:
//!   F-04  a foreign caller cannot release;
//!   F-05  release for a position not in a terminal state reverts;
//!   the gate has TEETH — under `--features break_escrow` the foreign-caller
//!         test FAILS, proving the invariant is enforced by code, not copy.
//!
//! Run:  cargo test -p floorline-escrow                 (must pass)
//!       cargo test -p floorline-escrow --features break_escrow   (must FAIL)

use floorline_escrow::Escrow;
use near_sdk::json_types::{U128, U64};
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::{testing_env, AccountId, PromiseResult};

const VAULT: &str = "vault3.floorline-escrow.testnet";
const ATTACKER: &str = "attacker.near";
const TOKEN: &str = "wrap.testnet";

fn escrow() -> Escrow {
    Escrow::new(VAULT.parse().unwrap(), TOKEN.parse().unwrap())
}

fn env_as(predecessor: &str) {
    let ctx = VMContextBuilder::new()
        .predecessor_account_id(predecessor.parse::<AccountId>().unwrap())
        .build();
    testing_env!(ctx);
}

fn env_with_promise(predecessor: &str, promise: PromiseResult) {
    let ctx = VMContextBuilder::new()
        .predecessor_account_id(predecessor.parse::<AccountId>().unwrap())
        .build();
    testing_env!(
        ctx,
        near_sdk::test_vm_config(),
        near_sdk::RuntimeFeesConfig::test(),
        Default::default(),
        vec![promise],
    );
}

/// The lock must be recorded and the aggregate must track it (I1 bookkeeping).
#[test]
fn lock_is_recorded_and_aggregated() {
    env_as(VAULT);
    let mut escrow = escrow();
    escrow.ft_on_transfer(
        VAULT.parse().unwrap(),
        U128(1_350_000_000_000_000_000_000_000),
        "1".to_string(),
    );
    assert_eq!(
        escrow.locked().0,
        1_350_000_000_000_000_000_000_000,
        "locked() must equal the escrowed reserve"
    );
    assert_eq!(
        escrow.locked_for(U64(1)).0,
        1_350_000_000_000_000_000_000_000
    );
    // Idempotent re-lock of the same position replaces, never doubles.
    escrow.ft_on_transfer(
        VAULT.parse().unwrap(),
        U128(1_350_000_000_000_000_000_000_000),
        "1".to_string(),
    );
    assert_eq!(
        escrow.locked().0,
        1_350_000_000_000_000_000_000_000,
        "total_locked must stay == Σ per-position locks (I1 aggregate)"
    );
}

/// F-04: any account except the vault must be unable to release the reserve.
/// Under `--features break_escrow` this gate is removed and this test FAILS —
/// that failure IS the proof the invariant has teeth (K-5).
#[test]
fn escrow_blocks_foreign_caller() {
    env_as(VAULT);
    let mut escrow = escrow();
    escrow.ft_on_transfer(VAULT.parse().unwrap(), U128(1_000), "1".to_string());

    env_as(ATTACKER);
    let drained = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _ = escrow.release(U64(1), ATTACKER.parse().unwrap(), U128(1_000));
    }))
    .is_err();

    assert!(drained, "INVARIANT BROKEN: a non-vault caller moved the reserve");
}

/// F-05: the vault itself cannot release for a position the vault does not
/// report as Matured/Degraded/Settled — the cross-check reverts.
#[test]
fn escrow_rejects_non_terminal_state() {
    env_as(VAULT);
    let mut escrow = escrow();
    escrow.ft_on_transfer(VAULT.parse().unwrap(), U128(1_000), "1".to_string());

    // The vault's position_state answers "Active" → the release callback
    // must abort. (on_release_check is the private receipt that consumes the
    // cross-contract answer; in production release() schedules it.)
    env_with_promise(
        VAULT,
        PromiseResult::Successful(b"\"Active\"".to_vec()),
    );
    let released = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        escrow.on_release_check(U64(1), VAULT.parse().unwrap(), U128(1_000));
    }))
    .is_err();
    assert!(
        released,
        "release must revert for a position in Active state (I1)"
    );
}

/// release for more than the locked reserve reverts (ErrExceedsFloor).
#[test]
fn escrow_rejects_overrelease() {
    env_as(VAULT);
    let mut escrow = escrow();
    escrow.ft_on_transfer(VAULT.parse().unwrap(), U128(500), "1".to_string());
    let over = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        escrow.release(U64(1), VAULT.parse().unwrap(), U128(501));
    }))
    .is_err();
    assert!(over, "release above the locked reserve must revert");
}

/// A valid release path (vault + Matured state) decrements the lock bookkeeping.
#[test]
fn escrow_release_from_matured_updates_bookkeeping() {
    env_as(VAULT);
    let mut escrow = escrow();
    escrow.ft_on_transfer(VAULT.parse().unwrap(), U128(1_000), "1".to_string());

    // The vault reports Matured; on_release_check moves the reserve out and
    // the transfer completes.
    env_with_promise(
        VAULT,
        PromiseResult::Successful(b"\"Matured\"".to_vec()),
    );
    let _ = escrow.on_release_check(U64(1), VAULT.parse().unwrap(), U128(1_000));
    assert_eq!(escrow.locked().0, 0, "lock bookkeeping must decrement on release");
}
