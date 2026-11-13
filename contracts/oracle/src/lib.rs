//! Floorline price oracle — the on-chain SECONDARY price source (F-08 / T-02).
//!
//! The keeper (or any price-source account) writes prices here; the vault
//! cross-checks its primary (oracle-signed) quote against this contract's
//! stored price and rejects a disagreement beyond `oracle_disagreement_bps`.
//!
//! Interface:
//!   new(admin, stale_after_sec)
//!   set_price(asset_id, price_1e18)   — predecessor == admin only
//!   get_price(asset_id)               — view: (U128 price, u64 set_at_ms)
//!   is_stale(asset_id)                — view: whether the stored price is too old
//!
//! On mainnet this module is replaced by a real multi-source oracle feed;
//! the vault wiring (`secondary_oracle.get_price`) is unchanged.

use near_sdk::collections::LookupMap;
use near_sdk::json_types::{U128, U64};
use near_sdk::{env, near, AccountId};

#[near(contract_state)]
pub struct PriceOracle {
    /// The only account allowed to write prices.
    admin: AccountId,
    /// asset_id → (price_1e18, set_at_ms)
    prices: LookupMap<String, (U128, U64)>,
    /// Prices older than this are reported stale.
    stale_after_sec: u64,
}

impl Default for PriceOracle {
    /// Placeholder for the wasm non-contract fallback cfg — real state is
    /// always constructed via `new()` at deployment (same pattern as the
    /// escrow contract).
    fn default() -> Self {
        Self {
            admin: "floorline-escrow.testnet".parse().unwrap(),
            prices: LookupMap::new(b"prices".to_vec()),
            stale_after_sec: 60,
        }
    }
}

#[near]
impl PriceOracle {
    #[init]
    pub fn new(admin: AccountId, stale_after_sec: U64) -> Self {
        Self {
            admin,
            prices: LookupMap::new(b"prices".to_vec()),
            stale_after_sec: stale_after_sec.0,
        }
    }

    /// Write the secondary price for an asset. Only the admin account.
    pub fn set_price(&mut self, asset_id: String, price_1e18: U128) {
        if env::predecessor_account_id() != self.admin {
            env::panic_str("ErrNotOracleAdmin");
        }
        if price_1e18.0 == 0 {
            env::panic_str("ErrZeroPrice");
        }
        self.prices.insert(
            &asset_id,
            &(price_1e18, U64(env::block_timestamp_ms())),
        );
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"OraclePriceSet\",\"data\":{{\"asset\":\"{asset_id}\",\"price\":\"{}\"}}}}",
            price_1e18.0
        ));
    }

    /// View: (price_1e18, set_at_ms). Missing price → (0, 0) so the vault can
    /// distinguish "no data" from a disagreement.
    pub fn get_price(&self, asset_id: String) -> (U128, U64) {
        self.prices.get(&asset_id).unwrap_or((U128(0), U64(0)))
    }

    /// View: has the stored price gone stale?
    pub fn is_stale(&self, asset_id: String) -> bool {
        match self.prices.get(&asset_id) {
            Some((_, U64(set_at))) => {
                env::block_timestamp_ms().saturating_sub(set_at) > self.stale_after_sec * 1_000
            }
            None => true,
        }
    }

    pub fn get_admin(&self) -> AccountId {
        self.admin.clone()
    }
}

#[cfg(all(test, feature = "unit-testing"))]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, AccountId};

    #[test]
    fn init_and_set_price_work() {
        let ctx = VMContextBuilder::new()
            .current_account_id("oracle.testnet".parse().unwrap())
            .predecessor_account_id("admin.testnet".parse().unwrap())
            .build();
        testing_env!(ctx);
        let mut o = PriceOracle::new("admin.testnet".parse().unwrap(), U64(60));
        assert_eq!(o.get_admin().to_string(), "admin.testnet");
        o.set_price("nvda.testnet".to_string(), U128(1_000));
        let (price, _) = o.get_price("nvda.testnet".to_string());
        assert_eq!(price.0, 1_000);
        assert!(!o.is_stale("nvda.testnet".to_string()));
    }
}
