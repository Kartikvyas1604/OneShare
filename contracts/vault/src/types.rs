//! Vault types — Agent.md §4.1. Every constant mirrors the web core (single
//! source of truth); every field maps to the on-chain storage layout.

use near_sdk::{near, AccountId, Timestamp};
use schemars::JsonSchema;

/// Position lifecycle (§4.4). Serialized as these exact strings so the web
/// app, the indexer, and the escrow state check agree.
#[near(serializers = [borsh()])]
#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub enum PositionState {
    Open,
    Active,
    DeRisked,
    Matured,
    Settled,
    Degraded,
}

impl PositionState {
    /// Name used across the API surface.
    pub fn as_str(&self) -> &'static str {
        match self {
            PositionState::Open => "Open",
            PositionState::Active => "Active",
            PositionState::DeRisked => "DeRisked",
            PositionState::Matured => "Matured",
            PositionState::Settled => "Settled",
            PositionState::Degraded => "Degraded",
        }
    }
}

/// One position per deposit — the NEP-171 token (token_id == position_id).
#[near(serializers = [borsh()])]
#[derive(Clone, Debug)]
#[derive(JsonSchema)]
pub struct Position {
    pub owner: AccountId,
    pub deposit_amount: u128,
    /// The escrowed reserve (I3: written once, never mutated).
    pub floor_amount: u128,
    /// deposit − floor; the only bucket the market can touch (I2 bound).
    pub risk_budget: u128,
    /// Whole risk-asset units held (24-dec display for wNEAR).
    pub risk_units: u128,
    /// Quote units spent acquiring risk_units.
    pub cost_basis: u128,
    /// Quote units already returned by a de-risk sale (I6 latch data).
    pub realised_quote: u128,
    pub de_risked: bool,
    pub opened_at: Timestamp,
    pub matures_at: Timestamp,
    pub state: PositionState,
    /// Risk asset this position rides (fallback: wNEAR).
    pub risk_asset_id: String,
    /// Last computed NAV, in quote units.
    pub nav_quote: u128,
}

impl Position {
    fn settled_before(&self) -> bool {
        self.state == PositionState::Settled
    }
}

/// Immutable vault configuration (§4.1) — set at `new()` and never mutated.
/// u128 fields use near_sdk::json_types::U128 (string serde) for the call args.
/// JsonSchema derives via schemars for the contract ABI.
#[near(serializers = [borsh()])]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, schemars::JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct VaultConfig {
    /// Quote asset: USDC on NEAR (6 decimals). NEP-141 asset id (contains ':').
    pub quote_asset_id: String,
    /// Risk asset for v1: wNEAR via the verified 1Click fallback (G-2).
    pub risk_asset_id: String,
    /// Share of every deposit escrowed as reserve. 5_000..9_800, step 100.
    pub floor_ratio_bps: u16,
    /// De-risk trigger: sell the bucket at this drawdown from cost basis.
    pub de_risk_trigger_bps: u16,
    /// Deposits below this revert.
    pub min_deposit: near_sdk::json_types::U128,
    /// Total deposits capped (ErrTvlCap).
    pub max_tvl: near_sdk::json_types::U128,
    /// Price quotes older than this are rejected (ErrPriceStale).
    pub price_max_age_sec: u64,
    /// Early exit fee: NAV × (10⁴ − fee) / 10⁴.
    pub early_exit_fee_bps: u16,
    /// Settlement timeout before a position degrades (§4.4).
    pub settlement_timeout_sec: u64,
    /// Position term (§4.1: default 30 days).
    pub term_seconds: u64,
    /// Management/performance fees — 0 for the hackathon build.
    pub mgmt_fee_bps: u16,
    pub perf_fee_bps: u16,
    /// Quote asset token decimals (USDC 6; wNEAR 24) — drives all quote-value
    /// math in §4.2. Must match the NEP-141 metadata of `quote_asset_id`.
    pub quote_decimals: u32,
    /// Risk asset token decimals (nNVDA 6 on testnet; xStocks 6).
    pub risk_decimals: u32,
    /// Secondary-oracle disagreement bound in bps (spec §4.1: 300 = 3%).
    /// record_buy/record_de_risk reject a primary quote whose price differs
    /// from the secondary oracle's stored price by more than this (F-08).
    pub oracle_disagreement_bps: u16,
    /// Ed25519 public key (64 hex chars) of the price oracle. Every
    /// record_buy/record_de_risk quote MUST carry a valid signature over
    /// `floorline-quote:{position_id}:{price_1e18}:{quote_timestamp_ms}` from
    /// this key — the on-chain enforcement of T-02 (T-02: an unsigned or
    /// wrongly-signed price cannot move a position).
    pub oracle_pubkey_hex: String,
}

impl Default for VaultConfig {
    fn default() -> Self {
        Self {
            quote_asset_id:
                "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1".to_string(),
            risk_asset_id: "nep141:wrap.near".to_string(),
            floor_ratio_bps: 9_000,
            de_risk_trigger_bps: 5_000,
            min_deposit: near_sdk::json_types::U128(10_000_000), // 10 USDC
            max_tvl: near_sdk::json_types::U128(100_000_000_000), // 100,000 USDC
            price_max_age_sec: 60,
            early_exit_fee_bps: 100,          // 1%
            settlement_timeout_sec: 1_200,    // 20 min
            term_seconds: 2_592_000,          // 30 days
            mgmt_fee_bps: 0,
            perf_fee_bps: 0,
            quote_decimals: 6,
            risk_decimals: 24,
            oracle_disagreement_bps: 300,
            // Price-oracle key: quotes must be signed by this key (T-02).
            // Test keypair committed for the test build; mainnet uses a
            // generated key whose seed never enters the repo.
            oracle_pubkey_hex:
                "95ae72804c1662017e5b1198eb2a2824ad8a6c4c8ba0034589796ebe29de57c1".to_string(),
        }
    }
}

/// Testnet variant: quote = wNEAR (directly obtainable on testnet), risk =
/// the NVDA stand-in token (6 decimals) so the equity leg holds NVIDIA-labeled
/// units for real.
impl VaultConfig {
    pub fn testnet() -> Self {
        Self {
            quote_asset_id: "wrap.testnet".to_string(),
            risk_asset_id: "nvda.floorline-escrow.testnet".to_string(),
            min_deposit: near_sdk::json_types::U128(1_000_000_000_000_000_000_000_000), // 1 wNEAR (24 dec)
            quote_decimals: 24,
            risk_decimals: 6,
            oracle_disagreement_bps: 300,
            ..Default::default()
        }
    }
}

/// External (web + indexer) view of a position. Amounts are U128 JSON strings
/// for u128 fidelity; timestamps are nanoseconds.
#[near(serializers = [json()])]
#[derive(Clone, Debug)]
pub struct PositionView {
    pub position_id: u64,
    pub owner: AccountId,
    pub deposit_amount: u128,
    pub floor_amount: u128,
    pub risk_budget: u128,
    pub risk_units: u128,
    pub cost_basis: u128,
    pub realised_quote: u128,
    pub de_risked: bool,
    pub opened_at: Timestamp,
    pub matures_at: Timestamp,
    pub state: String,
    pub nav_quote: u128,
}
