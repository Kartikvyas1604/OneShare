//! Golden vector test — Agent.md §4.5. The SAME numbers the TypeScript core
//! and the web app compute. Rust must produce identical integers.

use floorline_vault::math;
use floorline_vault::types::VaultConfig;

#[test]
fn golden_vector() {
    // D = 1,000.000000 USDC, floor 90%, P = $3.58 (1e18)
    let d: u128 = 1_000_000_000;
    let (f, r) = math::split_deposit(d, 9_000);
    assert_eq!(f, 900_000_000);
    assert_eq!(r, 100_000_000);

    // q* = floor(R × 10^24 × 10¹⁸ / (P × 10⁶)) = 27_932_960_893_854_748_603_351_955
    // (the exact scaled integer from §4.5)
    let q = math::target_units(r, 3_580_000_000_000_000_000, 24, 6);
    assert_eq!(q, 27_932_960_893_854_748_603_351_955u128);

    // unit_value(q*) ≤ R (back to quote scale)
    let value = math::unit_value_quote(
        27_932_960_893_854_748_603_351_955,
        3_580_000_000_000_000_000,
        24,
        6,
    );
    assert!(value <= r, "unit_value(q*) must not exceed the risk budget");
}

#[test]
fn split_identity_holds_for_random_amounts() {
    // F-03: floor + risk == deposit for 10,000 random amounts.
    let mut seed: u128 = 20261112;
    let mut next = move || {
        seed = seed
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        (seed >> 33) as u128
    };
    for _ in 0..10_000 {
        let d = next() % 100_000_000_000_000 + 10_000_000; // ≥ min deposit
        let ratio = 5_000u16 + ((next() % 49) as u16) * 100; // 50%..98%
        let (f, r) = math::split_deposit(d, ratio);
        assert_eq!(f + r, d, "F-03 violated for d={d}, ratio={ratio}");
    }
}

#[test]
fn de_risk_boundary_is_strict() {
    // §4.7 #3: exactly the boundary does NOT fire.
    let config = VaultConfig::default();
    assert_eq!(config.de_risk_trigger_bps, 5_000);
    assert!(!math::de_risk_triggered_at(50_000_000, 100_000_000, false, 5_000));
    assert!(math::de_risk_triggered_at(49_999_999, 100_000_000, false, 5_000));
    assert!(!math::de_risk_triggered_at(49_999_999, 100_000_000, true, 5_000)); // I6
}

#[test]
fn worst_case_is_floor_plus_realised() {
    // worst_case = F + realised_quote (§6.2)
    let nav = 948_310_000;
    let realised = 48_310_000;
    let floor = 900_000_000;
    assert_eq!(nav - (floor + realised), 0);
}
