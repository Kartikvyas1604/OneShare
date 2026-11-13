//! Vault math — Agent.md §4.2 formulas, integer-only (u128, checked).
//! The golden vector (§4.5) must match packages/core byte-for-byte.

use crate::types::{Position, VaultConfig};
use primitive_types::U256;

pub const PRICE_SCALE: u128 = 10u128.pow(18);
/// Quote asset decimals (USDC).
pub const DEC_Q: u32 = 6;

/// (1)/(2): F = floor(D × ratio / 10⁴); R = D − F. Floor division, always.
pub fn split_deposit(deposit: u128, floor_ratio_bps: u16) -> (u128, u128) {
    let floor = deposit
        .checked_mul(u128::from(floor_ratio_bps))
        .and_then(|v| v.checked_div(10_000))
        .unwrap_or_else(|| panic!("overflow"));
    (floor, deposit - floor)
}

/// (3): unit_value_quote(q) = (q × P / 10¹⁸) × 10^DEC_Q / 10^DEC_R.
/// `q` is in risk-asset whole units scaled by 10^DEC_R; P is 1e18-scaled.
/// 256-bit intermediates: q × P overflows u128 on the golden vector.
pub fn unit_value_quote(q_risk_scaled: u128, price_1e18: u128, dec_r: u32) -> u128 {
    let value_scaled = U256::from(q_risk_scaled) * U256::from(price_1e18) / U256::from(PRICE_SCALE);
    let value = if DEC_Q >= dec_r {
        value_scaled * U256::from(10u128.pow(DEC_Q - dec_r))
    } else {
        value_scaled / U256::from(10u128.pow(dec_r - DEC_Q))
    };
    if value > U256::from(u128::MAX) {
        panic!("overflow");
    }
    value.as_u128()
}

/// (4): NAV = F + unit_value(q) + realised_quote.
pub fn nav(position: &Position, price_1e18: u128, dec_r: u32) -> u128 {
    position
        .floor_amount
        .checked_add(unit_value_quote(position.risk_units, price_1e18, dec_r))
        .and_then(|v| v.checked_add(position.realised_quote))
        .unwrap_or_else(|| panic!("overflow"))
}

/// §6.2 worst_case = F + realised_quote — the depositor's guaranteed floor.
pub fn worst_case_quote(position: &Position) -> u128 {
    position
        .floor_amount
        .checked_add(position.realised_quote)
        .unwrap_or_else(|| panic!("overflow"))
}

/// (5): cushion C = NAV − F (≥ 0 by I1).
pub fn cushion(position: &Position, price_1e18: u128, dec_r: u32) -> u128 {
    nav(position, price_1e18, dec_r)
        .checked_sub(position.floor_amount)
        .unwrap_or_else(|| panic!("cushion negative — I1 violated"))
}

/// (6): fires iff `unit_value × 10⁴ < cost_basis × (10⁴ − trigger)` —
/// strict `<` so the exact boundary does not fire (§4.7 #3). Single-shot via
/// the `de_risked` latch (I6).
pub fn de_risk_triggered_at(
    unit_value_quote: u128,
    cost_basis: u128,
    de_risked: bool,
    trigger_bps: u16,
) -> bool {
    if cost_basis == 0 || de_risked {
        return false;
    }
    unit_value_quote
        .checked_mul(10_000)
        .unwrap_or_else(|| panic!("overflow"))
        < cost_basis
            .checked_mul((10_000 - trigger_bps as u128) as u128)
            .unwrap_or_else(|| panic!("overflow"))
}

/// (8): early exit payout = NAV × (10⁴ − fee) / 10⁴.
pub fn early_exit_payout(nav: u128, config: &VaultConfig) -> u128 {
    nav.checked_mul((10_000 - config.early_exit_fee_bps as u128) as u128)
        .and_then(|v| v.checked_div(10_000))
        .unwrap_or_else(|| panic!("overflow"))
}

/// (10): target units q* = floor(R × 10^DEC_R × 10¹⁸ / (P × 10^DEC_Q)).
/// 256-bit intermediates: R×10²⁴ overflows u128 on the golden vector.
pub fn target_units(risk_budget: u128, price_1e18: u128, dec_r: u32) -> u128 {
    let numerator = U256::from(risk_budget) * U256::from(10u128.pow(dec_r)) * U256::from(PRICE_SCALE);
    let denominator = U256::from(price_1e18) * U256::from(10u128.pow(DEC_Q));
    let q = numerator / denominator;
    if q > U256::from(u128::MAX) {
        panic!("overflow");
    }
    q.as_u128()
}

/// I2: cost_basis + realised_quote ≤ R — the risk bucket can never eat the reserve.
pub fn risk_budget_honored(position: &Position) -> bool {
    position
        .cost_basis
        .checked_add(position.realised_quote)
        .map(|v| v <= position.risk_budget)
        .unwrap_or(false)
}
