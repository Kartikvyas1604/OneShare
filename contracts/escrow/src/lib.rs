//! Floorline escrow — the reserve contract whose only door is the vault's settle path
//!
//! The separate reserve contract (invariant I1): the vault transfers each
//! position's reserve here at deposit, and `release` is gated on BOTH
//! `predecessor == vault` AND the position being in `Matured`/`Degraded`
//! state (checked by querying the vault back). No other code path can move
//! the reserve.

use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::{env, ext_contract, json_types::U64, near, AccountId, Gas, NearToken, Promise, PromiseOrValue, PromiseResult};

/// Vault contract id (set at init).
#[ext_contract(ext_vault)]
trait Vault {
    fn position_state(&self, position_id: u64) -> String;
}

/// Gas for the cross-contract state check + the transfer callback.
const GAS_RELEASE_CHECK: Gas = Gas::from_tgas(15);
/// The finalize callback schedules the token transfer (15 TGas) plus its own
/// completion callback (12 TGas) — 40 TGas covers all three.
const GAS_RELEASE_FINALIZE: Gas = Gas::from_tgas(40);
/// Completion callback after the reserve transfer.
const GAS_TRANSFER_COMPLETE: Gas = Gas::from_tgas(12);

impl Default for Escrow {
    /// Placeholder for the wasm non-contract fallback cfg — real state is
    /// always constructed via `new()` at deployment.
    fn default() -> Self {
        Self {
            vault: "floorline-demo.near".parse().unwrap(),
            // The USDC token contract on NEAR (implicit account behind the
            // nep141 asset id).
            quote_asset:
                "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
                    .parse()
                    .unwrap(),
            locks: LookupMap::new(b"locks".to_vec()),
            total_locked: 0,
        }
    }
}

#[near(contract_state)]
pub struct Escrow {
    /// The only account allowed to call `release`.
    vault: AccountId,
    /// NEP-141 asset the reserve is held in (USDC on NEAR).
    quote_asset: AccountId,
    /// Per-position locked reserve, keyed by position id.
    locks: LookupMap<U64, u128>,
    /// Σ locks over all unsettled positions (I1).
    total_locked: u128,
}

#[near(serializers = [borsh()])]
pub struct PendingRelease {
    position_id: u64,
    to: AccountId,
    amount: u128,
}

#[near(contract_state)]
impl Escrow {
    /// Initialize the escrow with the vault that exclusively controls releases.
    /// `ignore_state` allows redeploying + re-initializing over stale state
    /// (testnet redeploys; the escrow holds no user funds outside locked
    /// reserves, which are zeroed by the vault's own bookkeeping).
    #[init(ignore_state)]
    pub fn new(vault: AccountId, quote_asset: AccountId) -> Self {
        Self {
            vault,
            quote_asset,
            locks: LookupMap::new(b"locks".to_vec()),
            total_locked: 0,
        }
    }

    /// NEP-141 receiver. The vault funds the reserve with
    /// `ft_transfer_call` and `msg = "<position_id>"`; the amount is locked
    /// against that position. Anything else is refunded to the sender.
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let position_id: u64 = msg
            .parse()
            .unwrap_or_else(|_| env::panic_str("ErrBadMsg: msg must be the position id"));
        if sender_id != self.vault {
            env::panic_str("ErrNotVault: only the vault may fund the reserve");
        }

        let amount = amount.0;
        // Idempotent: re-locking the same position replaces the previous lock
        // (keeps Σ locks == total_locked even if a position id is reused).
        let existing = self.locks.get(&U64(position_id)).unwrap_or(0);
        self.locks.insert(&U64(position_id), &amount);
        self.total_locked = self.total_locked.saturating_sub(existing) + amount;
        // Accept the full transfer (it is now locked).
        PromiseOrValue::Value(U128(0))
    }

    /// Read-only: the reserve currently locked for a position.
    pub fn locked_for(&self, position_id: U64) -> U128 {
        U128(self.locks.get(&position_id).unwrap_or(0))
    }

    /// Read-only: Σ locks over all unsettled positions (I1 check).
    pub fn locked(&self) -> U128 {
        U128(self.total_locked)
    }

    /// Release reserve for a settled (Matured/Degraded) position.
    ///
    /// Callable ONLY by the vault. The escrow queries the vault back for the
    /// position state and completes the transfer in a callback — a vault that
    /// calls `release` for an `Active` position reverts (ErrBadState).
    pub fn release(&mut self, position_id: U64, to: AccountId, amount: U128) -> Promise {
        // The I1 access gate. `break_escrow` (a deliberately broken build used
        // by the invariant suite to prove the tests have teeth) removes it —
        // the foreign-caller test must then FAIL.
        #[cfg(not(feature = "break_escrow"))]
        if env::predecessor_account_id() != self.vault {
            env::panic_str("ErrNotVault: only the vault may release the reserve");
        }
        #[cfg(feature = "break_escrow")]
        let _ = self.vault;
        let amount = amount.0;
        let locked = self.locks.get(&position_id).unwrap_or(0);
        if amount > locked {
            env::panic_str("ErrExceedsFloor: release exceeds the locked reserve");
        }

        // Cross-contract check: ask the vault for the position state.
        ext_vault::ext(self.vault.clone())
            .with_static_gas(GAS_RELEASE_CHECK)
            .position_state(position_id.0)
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_RELEASE_FINALIZE)
                    .on_release_check(position_id, to, U128(amount)),
            )
    }

    /// Private callback: verify the position state returned by the vault,
    /// then move the reserve out.
    #[private]
    pub fn on_release_check(
        &mut self,
        position_id: U64,
        to: AccountId,
        amount: U128,
    ) -> PromiseOrValue<U128> {
        let state = match env::promise_result(0) {
            PromiseResult::Successful(bytes) => serde_json::from_slice::<String>(&bytes)
                .unwrap_or_else(|_| env::panic_str("ErrBadState: unreadable state")),
            PromiseResult::Failed => env::panic_str("ErrBadState: vault state query failed"),
        };

        // Settled is accepted for early exits: the vault marks the position
        // Settled (terminal, dedup-guarded) before releasing on both settle
        // and exit_early paths. Matured/Degraded cover the keeperless flows.
        if state != "Matured" && state != "Degraded" && state != "Settled" {
            env::panic_str("ErrBadState: reserve releases only from Matured, Degraded or Settled");
        }

        self.do_transfer(position_id, to.to_string(), amount.0)
    }

    /// Move `amount` out to `to` (internal, after the gate passed).
    fn do_transfer(&mut self, position_id: U64, to: String, amount: u128) -> PromiseOrValue<U128> {
        let locked = self.locks.get(&position_id).unwrap_or(0);
        let amount = amount.min(locked);
        if amount == 0 {
            env::panic_str("ErrExceedsFloor: nothing to release");
        }

        let remaining = locked - amount;
        if remaining == 0 {
            self.locks.remove(&position_id);
        } else {
            self.locks.insert(&position_id, &remaining);
        }
        self.total_locked -= amount;

        // NEP-141 transfer back to the vault (which pays out to the owner):
        // the call goes to the TOKEN CONTRACT with the release target as
        // receiver. (Calling `ft_transfer` on `to` itself — the old code —
        // would hit an account that exports no such method.)
        Promise::new(self.quote_asset.clone())
            .function_call(
                "ft_transfer".to_string(),
                serde_json::to_vec(&serde_json::json!({
                    "receiver_id": to,
                    "amount": amount.to_string(),
                }))
                .unwrap(),
                NearToken::from_yoctonear(1), // 1 yoctoNEAR registration deposit
                GAS_RELEASE_FINALIZE,
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_TRANSFER_COMPLETE)
                    .on_transfer_complete(position_id, U128(amount)),
            )
            .into()
    }

    /// Private callback: if the NEP-141 transfer failed, the reserve never
    /// left — restore the lock and RETURN normally (no panic: a panic here
    /// would roll the restore back, losing the lock bookkeeping). The vault's
    /// ack treats the chain as complete; the payout leg will fail in turn and
    /// the position is restored for a retry — no double-pay is possible
    /// because the payout can only succeed if the reserve actually arrived.
    #[private]
    pub fn on_transfer_complete(&mut self, position_id: U64, amount: U128) -> PromiseOrValue<U128> {
        match env::promise_result(0) {
            PromiseResult::Successful(_) => PromiseOrValue::Value(U128(0)),
            PromiseResult::Failed => {
                // The reserve never left: put the lock back and mark it.
                let current = self.locks.get(&position_id).unwrap_or(0);
                self.locks.insert(&position_id, &(current + amount.0));
                self.total_locked += amount.0;
                env::log_str(&format!(
                    "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"ReleaseFailed\",\"data\":{{\"position_id\":{},\"amount\":\"{}\"}}}}",
                    position_id.0, amount.0
                ));
                PromiseOrValue::Value(U128(0))
            }
        }
    }
}
