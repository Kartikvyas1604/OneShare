//! Floorline vault — Agent.md §6.2.
//!
//! Deposits split into an escrowed reserve (transferred to the separate
//! escrow contract) and a risk budget; an automated de-risk rule sells the
//! risk bucket once if it drops below the trigger; settlement releases the
//! reserve and burns the position NFT. Positions are NEP-171 tokens
//! (token_id == position_id).

use near_sdk::collections::{LookupMap, UnorderedMap, UnorderedSet, Vector};
use near_sdk::json_types::U128;
use near_sdk::{env, ext_contract, near, json_types::U64, AccountId, Gas, NearToken, Promise, PromiseOrValue, PromiseResult, Timestamp};

pub mod math;
pub mod types;

use types::{Position, PositionState, PositionView, VaultConfig};

const NO_DEPOSIT: u128 = 0;
/// Gas budget for the I1 escrow transfer (ft_transfer_call on the quote
/// asset). NOTE: wrap.testnet runs near-contract-standards 3.1.0, whose
/// `ft_transfer_call` does a bare `env::prepaid_gas() - 30 TGas` to fund the
/// receiver call — the attached gas MUST exceed 30 TGas or it panics with
/// "attempt to subtract with overflow". 45 TGas gives the receiver 15 TGas.
const GAS_DEPOSIT: Gas = Gas::from_tgas(45);
/// settle ≤ 80 TGas (escrow release chain: state check 15 + finalize 40).
const GAS_SETTLE: Gas = Gas::from_tgas(80);
/// Vault-side completion callbacks (ack / settle payout: own work + a 15
/// TGas child transfer).
const GAS_ESCROW_CALLBACK: Gas = Gas::from_tgas(30);

#[ext_contract(ext_escrow)]
trait Escrow {
    fn release(&mut self, position_id: U64, to: AccountId, amount: U128) -> Promise;
}

impl Default for Vault {
    /// Placeholder for the wasm non-contract fallback cfg — real state is
    /// always constructed via `new()` at deployment.
    fn default() -> Self {
        Self {
            config: VaultConfig::default(),
            escrow_account: "floor.vault-demo.near".parse().unwrap(),
            treasury: "treasury.floorline-demo.near".parse().unwrap(),
            paused: false,
            secondary_oracle: "oracles.near".parse().unwrap(),
            positions: UnorderedMap::new(b"positions".to_vec()),
            owner_positions: LookupMap::new(b"owner_positions".to_vec()),
            next_position_id: 1,
            total_floor_locked: 0,
            total_deposited: 0,
            settled_positions: UnorderedSet::new(b"settled_positions".to_vec()),
            settled_deposits: UnorderedSet::new(b"settled_deposits".to_vec()),
        }
    }
}

#[near(contract_state)]
pub struct Vault {
    config: VaultConfig,
    escrow_account: AccountId,
    treasury: AccountId,
    paused: bool,
    /// Owner-set oracle account for the disagreement bound (§4.1).
    secondary_oracle: AccountId,

    positions: UnorderedMap<U64, Position>,
    /// owner → position ids (positions_of view + NFT enumeration).
    owner_positions: LookupMap<AccountId, Vector<U64>>,
    /// Next NEP-171 token id (== position id).
    next_position_id: u64,
    /// Σ floor amounts escrowed (I1 aggregate the web app displays).
    total_floor_locked: u128,
    /// Σ deposits (TVL cap, ErrTvlCap).
    total_deposited: u128,
    /// Idempotent settlement keys (I5): position_id → settled.
    settled_positions: UnorderedSet<U64>,
    /// Idempotent 1Click deposit-address settlements (I5 / F-14).
    settled_deposits: UnorderedSet<String>,
}

#[near(contract_state)]
impl Vault {
    /// Initialize. Immutability after `new()` per §4.1.
    #[init]
    pub fn new(
        config: Option<VaultConfig>,
        escrow_account: Option<AccountId>,
        treasury: Option<AccountId>,
        secondary_oracle: Option<AccountId>,
    ) -> Self {
        Self {
            config: config.unwrap_or_default(),
            escrow_account: escrow_account
                .unwrap_or_else(|| "floor.vault-demo.near".parse().unwrap()),
            treasury: treasury.unwrap_or_else(|| "treasury.floorline-demo.near".parse().unwrap()),
            paused: false,
            secondary_oracle: secondary_oracle.unwrap_or_else(|| "oracles.near".parse().unwrap()),
            positions: UnorderedMap::new(b"positions".to_vec()),
            owner_positions: LookupMap::new(b"owner_positions".to_vec()),
            next_position_id: 1,
            total_floor_locked: 0,
            total_deposited: 0,
            settled_positions: UnorderedSet::new(b"settled_positions".to_vec()),
            settled_deposits: UnorderedSet::new(b"settled_deposits".to_vec()),
        }
    }

    // ─── NEP-141 receiver: the deposit entry (F-01/F-02/F-03) ───

    /// The vault receives USDC via `ft_transfer_call` with msg = "deposit".
    /// Splits the deposit, transfers the reserve to the escrow, mints the
    /// position NFT in `Open` state.
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        if !msg.starts_with("deposit") {
            env::panic_str("ErrBadMsg: msg must be \"deposit\" or \"deposit:<ratio_bps>\"");
        }
        // NOTE: deposits are ALLOWED while paused (spec edge case 9) — the
        // pause gate covers buys and de-risks only (assert_buy_preconditions).
        if env::predecessor_account_id().to_string() != self.config.quote_asset_id {
            env::panic_str("ErrBadAsset: only the quote asset is accepted");
        }

        let deposit = amount.0;
        if deposit < self.config.min_deposit.0 {
            env::panic_str("ErrBelowMinDeposit");
        }
        if self.total_deposited.checked_add(deposit).unwrap_or(u128::MAX) > self.config.max_tvl.0 {
            env::panic_str("ErrTvlCap");
        }

        // The loss limit is per deposit: msg = "deposit" uses the vault ratio;
        // msg = "deposit:<ratio_bps>" overrides it. The contract clamps BOTH
        // paths to [5000, 9800] step 100 (F-22) — no caller, human or agent,
        // can push the risk budget past 50% of the deposit.
        // msg = "deposit" (vault ratio) or "deposit:<ratio_bps>" (per-deposit
        // loss limit). The strict legacy check is replaced by the parser below.
        let ratio_bps: u16 = match msg.strip_prefix("deposit:") {
            Some(raw) => match raw.parse::<u16>() {
                Ok(r) => {
                    if r < 5_000 || r > 9_800 || r % 100 != 0 {
                        env::panic_str("ErrStepExceeded: ratio must be in [5000, 9800] step 100");
                    }
                    r
                }
                Err(_) => env::panic_str("ErrBadMsg: deposit ratio must be a bps integer"),
            },
            None => self.config.floor_ratio_bps,
        };

        // F + R with floor division (formula 1/2); F-03 identity holds by construction.
        let (floor_amount, risk_budget) = math::split_deposit(deposit, ratio_bps);
        let position_id = self.next_position_id;
        self.next_position_id += 1;

        let position = Position {
            owner: sender_id.clone(),
            deposit_amount: deposit,
            floor_amount,
            risk_budget,
            risk_units: 0,
            cost_basis: 0,
            realised_quote: 0,
            de_risked: false,
            opened_at: env::block_timestamp(),
            matures_at: env::block_timestamp() + u64::from(self.config.term_seconds) * 1_000_000_000,
            state: PositionState::Open,
            risk_asset_id: self.config.risk_asset_id.clone(),
            nav_quote: floor_amount,
        };

        self.positions.insert(&U64(position_id), &position);
        let mut ids = self
            .owner_positions
            .get(&sender_id)
            .unwrap_or_else(|| Vector::new(b"owner_positions_v1".to_vec()));
        ids.push(&U64(position_id));
        self.owner_positions.insert(&sender_id, &ids);
        self.total_floor_locked += floor_amount;
        self.total_deposited += deposit;

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"Deposited\",\"data\":{{\"position_id\":{position_id},\"owner\":\"{sender_id}\",\"deposit_amount\":\"{deposit}\",\"floor_amount\":\"{floor_amount}\",\"risk_budget\":\"{risk_budget}\"}}}}"
        ));

        // I1: the reserve leaves the vault immediately — ft_transfer_call on
        // the QUOTE ASSET contract, receiver = the escrow, msg = position id.
        // The escrow's ft_on_transfer locks it. State updates finalize in the
        // on_escrow_ack callback (no partial state on failure).
        Promise::new(self.config.quote_asset_id.parse().unwrap())
            .function_call(
                "ft_transfer_call".to_string(),
                serde_json::to_vec(&serde_json::json!({
                    "receiver_id": self.escrow_account,
                    "amount": floor_amount.to_string(),
                    "msg": position_id.to_string(),
                }))
                .unwrap(),
                NearToken::from_yoctonear(1),
                GAS_DEPOSIT,
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_ESCROW_CALLBACK)
                    .on_escrow_ack(position_id, sender_id, deposit, floor_amount),
            )
            .into()
    }

    /// Private callback: the escrow acknowledged the reserve — finalize the
    /// position state. On failure, refund the deposit (the wrap contract's
    /// promise failure propagates as the ft_transfer_call's refund).
    #[private]
    pub fn on_escrow_ack(
        &mut self,
        position_id: u64,
        owner: AccountId,
        deposit: u128,
        floor_amount: u128,
    ) -> PromiseOrValue<U128> {
        match env::promise_result(0) {
            PromiseResult::Successful(_) => {
                // Escrow locked the reserve. The position (written before the
                // promise) is now backed by I1.
                PromiseOrValue::Value(U128(0))
            }
            PromiseResult::Failed => {
                // I1 backstop: escrow failed — remove the position; returning
                // an error makes the token refund the full deposit to sender.
                self.remove_position(position_id, &owner);
                env::panic_str("ErrEscrowRejected: reserve transfer failed, deposit refunded");
            }
        }
    }

    fn remove_position(&mut self, position_id: u64, owner: &AccountId) {
        let key = U64(position_id);
        if let Some(pos) = self.positions.get(&key) {
            self.total_floor_locked -= pos.floor_amount;
            self.total_deposited -= pos.deposit_amount;
        }
        self.positions.remove(&key);
        if let Some(mut vec) = self.owner_positions.get(owner) {
            // Rebuild without the id (N small).
            let keep: Vec<U64> = vec.iter().filter(|v| v.0 != position_id).collect();
            vec.clear();
            for v in keep {
                vec.push(&v);
            }
            self.owner_positions.insert(owner, &vec);
        }
    }

    // ─── Buy (keeper-executed venue swap; contract enforces the rules) ───

    /// T-02 on-chain: a price quote is only trusted when the configured
    /// oracle key signed `floorline-quote:{position_id}:{price_1e18}:{ts}`.
    /// Anything else — replayed, truncated, or forged — reverts here, before
    /// any state change. `sig_hex` is the 64-byte ed25519 signature, hex.
    fn verify_oracle_quote(
        &self,
        position_id: u64,
        price_1e18: u128,
        quote_timestamp_ms: u64,
        quote_signature: &str,
    ) {
        let pubkey = self.oracle_pubkey();
        let sig = self.hex_to_64(quote_signature, "ErrBadQuoteSignature");
        let msg = format!("floorline-quote:{position_id}:{price_1e18}:{quote_timestamp_ms}");
        if !env::ed25519_verify(&sig, msg.as_bytes(), &pubkey) {
            env::panic_str("ErrBadQuoteSignature: price quote is not signed by the oracle key");
        }
    }

    fn oracle_pubkey(&self) -> [u8; 32] {
        let hex_str = &self.config.oracle_pubkey_hex;
        if hex_str.len() != 64 {
            env::panic_str("ErrNoOracle: oracle pubkey misconfigured");
        }
        self.hex_to_n(hex_str, "ErrNoOracle")
    }

    fn hex_to_64(&self, s: &str, err: &str) -> [u8; 64] {
        self.hex_to_n(s, err)
    }

    /// Fixed-size hex decode without a dependency; every failure is a loud
    /// panic (never a silent zero-fill).
    fn hex_to_n<const N: usize>(&self, s: &str, err: &str) -> [u8; N] {
        let bytes = s.as_bytes();
        if bytes.len() != N * 2 {
            env::panic_str(err);
        }
        let mut out = [0u8; N];
        let mut i = 0;
        while i < N {
            let hi = (bytes[i * 2] as char).to_digit(16).unwrap_or_else(|| env::panic_str(err));
            let lo = (bytes[i * 2 + 1] as char).to_digit(16).unwrap_or_else(|| env::panic_str(err));
            out[i] = (hi * 16 + lo) as u8;
            i += 1;
        }
        out
    }

    /// `record_buy` — the keeper reports the executed risk-asset purchase for
    /// a position. Permissionless: the contract validates the oracle
    /// signature (T-02), price freshness, the risk-budget cap (I2), and
    /// slippage against `min_out`.
    pub fn record_buy(
        &mut self,
        position_id: U64,
        actual_out: U128,
        cost: U128,
        min_out: U128,
        price_1e18: U128,
        quote_timestamp_ms: Timestamp,
        quote_signature: String,
    ) {
        self.verify_oracle_quote(
            position_id.0,
            price_1e18.0,
            quote_timestamp_ms,
            &quote_signature,
        );
        self.assert_buy_preconditions(price_1e18, quote_timestamp_ms);
        let mut position = self
            .positions
            .get(&position_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        if position.state == PositionState::Settled {
            env::panic_str("ErrAlreadySettled");
        }

        // Slippage: actual_out must clear min_out.
        if actual_out.0 < min_out.0 {
            env::panic_str("ErrSlippageExceeded");
        }
        // I2: cost + realised must stay within the risk budget.
        let new_cost = position.cost_basis.checked_add(cost.0).unwrap_or(u128::MAX);
        if new_cost > position.risk_budget {
            env::panic_str("ErrRiskBudgetExceeded");
        }

        position.risk_units += actual_out.0;
        position.cost_basis = new_cost;
        position.state = PositionState::Active;
        position.nav_quote = math::nav(&position, price_1e18.0, self.config.risk_decimals, self.config.quote_decimals);
        self.positions.insert(&position_id, &position);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"BuySettled\",\"data\":{{\"position_id\":{},\"actual_out\":\"{}\",\"min_out\":\"{}\"}}}}",
            position_id.0, actual_out.0, min_out.0
        ));
    }

    // ─── De-risk (formula 6, single-shot I6) ───

    /// `record_de_risk` — the keeper reports the sale of the whole risk
    /// bucket. Reverts unless formula (6) actually fired; latches `de_risked`.
    pub fn record_de_risk(
        &mut self,
        position_id: U64,
        realised_quote: U128,
        price_1e18: U128,
        quote_timestamp_ms: Timestamp,
        quote_signature: String,
    ) {
        self.verify_oracle_quote(
            position_id.0,
            price_1e18.0,
            quote_timestamp_ms,
            &quote_signature,
        );
        self.assert_buy_preconditions(price_1e18, quote_timestamp_ms);
        let mut position = self
            .positions
            .get(&position_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));

        if position.de_risked {
            env::panic_str("ErrAlreadyDeRisked");
        }
        if position.state == PositionState::Settled {
            env::panic_str("ErrAlreadySettled");
        }

        let unit_value = math::unit_value_quote(position.risk_units, price_1e18.0, self.config.risk_decimals, self.config.quote_decimals);
        if !math::de_risk_triggered_at(
            unit_value,
            position.cost_basis,
            position.de_risked,
            self.config.de_risk_trigger_bps,
        ) {
            env::panic_str("ErrTriggerNotReached");
        }

        // The whole bucket is sold; realised proceeds are locked (I6).
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"DeRiskTriggered\",\"data\":{{\"position_id\":{},\"cost_basis\":\"{}\",\"value_now\":\"{}\"}}}}",
            position_id.0, position.cost_basis, unit_value
        ));

        // The whole bucket is sold (I6, single-shot). The bucket's quote
        // footprint is now the realised proceeds — cost_basis zeroes so I2
        // (cost + realised ≤ R) measures the bucket, not the spent-and-returned
        // amount twice. A sale at price P returns units×P ≤ cost by
        // construction of the trigger, so realised ≤ R always holds.
        position.risk_units = 0;
        position.cost_basis = 0;
        position.realised_quote = realised_quote.0;
        position.de_risked = true;
        position.state = PositionState::DeRisked;
        position.nav_quote = math::nav(&position, price_1e18.0, self.config.risk_decimals, self.config.quote_decimals);
        self.positions.insert(&position_id, &position);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"DeRiskSettled\",\"data\":{{\"position_id\":{},\"realised_quote\":\"{}\"}}}}",
            position_id.0, realised_quote.0
        ));
    }

    // ─── Cross-chain settlement (I5 / F-14) ───

    /// `record_settlement` — the keeper (or anyone holding a valid SUCCESS
    /// payload, NF-06) reports that the venue settled the swap for
    /// `deposit_address`. Idempotent on the address: a replay is a no-op,
    /// never a double credit. Only `SUCCESS` is accepted; anything else
    /// reverts so a `REFUNDED`/`FAILED` status can never mark money arrived.
    pub fn record_settlement(&mut self, position_id: U64, deposit_address: String, status: String) {
        if status != "SUCCESS" {
            env::panic_str("ErrBadStatus: only SUCCESS settles");
        }
        if deposit_address.is_empty() || deposit_address.len() > 128 {
            env::panic_str("ErrBadDepositAddress");
        }
        if self
            .positions
            .get(&position_id)
            .is_none_or(|p| p.state == PositionState::Settled)
        {
            env::panic_str("ErrPositionNotFound");
        }
        // I5: the second call with the same address is a no-op.
        if self.settled_deposits.contains(&deposit_address) {
            env::log_str(&format!(
                "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"SettlementDeduped\",\"data\":{{\"deposit_address\":\"{deposit_address}\"}}}}"
            ));
            return;
        }
        self.settled_deposits.insert(&deposit_address);
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"SettlementRecorded\",\"data\":{{\"position_id\":{},\"deposit_address\":\"{deposit_address}\"}}}}",
            position_id.0
        ));
    }

    // ─── Settlement (§4.4) ───

    /// `settle` — the owner burns the position and receives NAV; the escrow
    /// releases the reserve. Only from `Matured` (ErrNotMatured otherwise).
    pub fn settle(&mut self, position_id: U64, price_1e18: U128) -> PromiseOrValue<U128> {
        self.assert_owner(position_id.0);
        let mut position = self
            .positions
            .get(&position_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));

        if position.state == PositionState::Settled {
            env::panic_str("ErrAlreadySettled");
        }
        if env::block_timestamp() < position.matures_at {
            env::panic_str("ErrNotMatured: use exit_early for a 1% fee");
        }
        if self.settled_positions.contains(&position_id) {
            env::panic_str("ErrDuplicateSettlement");
        }

        let payout = math::nav(&position, price_1e18.0, self.config.risk_decimals, self.config.quote_decimals); // formula (7) == max(F, NAV) by I1
        position.state = PositionState::Settled;
        position.nav_quote = payout;
        self.positions.insert(&position_id, &position);
        self.settled_positions.insert(&position_id);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PositionSettled\",\"data\":{{\"position_id\":{},\"payout\":\"{}\"}}}}",
            position_id.0, payout
        ));

        // I1: release the reserve through the escrow's gated path.
        ext_escrow::ext(self.escrow_account.clone())
            .with_static_gas(GAS_SETTLE)
            .release(
                U64::from(position_id),
                env::current_account_id(),
                U128(position.floor_amount),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_ESCROW_CALLBACK)
                    .on_settle_release(position_id.0, position.owner.clone(), U128(payout), "Matured".to_string()),
            )
            .into()
    }

    /// Private callback: escrow released the reserve — pay the owner and burn
    /// the NFT. If the release failed, revert the settled flag (funds stay).
    #[private]
    pub fn on_settle_release(
        &mut self,
        position_id: u64,
        owner: AccountId,
        payout: U128,
        prev_state: String,
    ) -> PromiseOrValue<U128> {
        match env::promise_result(0) {
            PromiseResult::Successful(_) => {
                // Pay out in the quote asset (the vault holds the risk sale
                // proceeds + the released reserve). The position is removed
                // only AFTER the payout confirms — a failed payout must never
                // strand the claim (the owner retries settle; no double-pay is
                // possible because the payout can only succeed if the reserve
                // actually arrived).
                Promise::new(
                    self.config
                        .quote_asset_id
                        .parse()
                        .unwrap_or_else(|_| env::panic_str("ErrBadAsset: bad quote asset id")),
                )
                    .function_call(
                        "ft_transfer".to_string(),
                        serde_json::to_vec(&serde_json::json!({
                            "receiver_id": owner,
                            "amount": payout.0.to_string(),
                        }))
                        .unwrap(),
                        NearToken::from_yoctonear(1),
                        GAS_ESCROW_CALLBACK,
                    )
                    .then(
                        Self::ext(env::current_account_id())
                            .with_static_gas(GAS_ESCROW_CALLBACK)
                            .on_payout_complete(
                                position_id,
                                owner,
                                payout,
                                prev_state,
                            ),
                    )
                    .into()
            }
            PromiseResult::Failed => {
                // The escrow refused the release — restore the position and
                // RETURN normally (a panic would roll the restore back).
                if let Some(mut position) = self.positions.get(&U64(position_id)) {
                    position.state = match prev_state.as_str() {
                        "Active" => PositionState::Active,
                        "DeRisked" => PositionState::DeRisked,
                        "Degraded" => PositionState::Degraded,
                        _ => PositionState::Matured,
                    };
                    self.positions.insert(&U64(position_id), &position);
                }
                self.settled_positions.remove(&U64::from(position_id));
                env::log_str(&format!(
                    "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"ReleaseRejected\",\"data\":{{\"position_id\":{} }} }}",
                    position_id
                ));
                PromiseOrValue::Value(U128(0))
            }
        }
    }

    /// Private callback: finalize the settlement after the payout transfer.
    /// Success → remove the position (the claim is fulfilled). Failure →
    /// restore the position for a retry and mark the event; NO panic (a panic
    /// would roll the restore back and strand the claim).
    #[private]
    pub fn on_payout_complete(
        &mut self,
        position_id: u64,
        owner: AccountId,
        payout: U128,
        prev_state: String,
    ) -> PromiseOrValue<U128> {
        match env::promise_result(0) {
            PromiseResult::Successful(_) => {
                self.remove_position(position_id, &owner);
                PromiseOrValue::Value(U128(0))
            }
            PromiseResult::Failed => {
                if let Some(mut position) = self.positions.get(&U64(position_id)) {
                    position.state = match prev_state.as_str() {
                        "Active" => PositionState::Active,
                        "DeRisked" => PositionState::DeRisked,
                        "Degraded" => PositionState::Degraded,
                        _ => PositionState::Matured,
                    };
                    self.positions.insert(&U64(position_id), &position);
                }
                self.settled_positions.remove(&U64::from(position_id));
                env::log_str(&format!(
                    "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PayoutFailed\",\"data\":{{\"position_id\":{},\"payout\":\"{}\"}} }}",
                    position_id, payout.0
                ));
                PromiseOrValue::Value(U128(0))
            }
        }
    }

    /// `exit_early` — owner exits before maturity for NAV × (1 − fee) (formula 8).
    pub fn exit_early(&mut self, position_id: U64, price_1e18: U128) -> PromiseOrValue<U128> {
        self.assert_owner(position_id.0);
        let mut position = self
            .positions
            .get(&position_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        if position.state == PositionState::Settled {
            env::panic_str("ErrAlreadySettled");
        }

        let nav = math::nav(
            &position,
            price_1e18.0,
            self.config.risk_decimals,
            self.config.quote_decimals,
        );
        let payout = math::early_exit_payout(nav, &self.config);
        // Mark terminal BEFORE the release: the escrow cross-checks the
        // position state back (I1 gate) and the dedup set guards replays.
        let prev_state = position.state.as_str().to_string();
        position.state = PositionState::Settled;
        position.nav_quote = payout;
        self.positions.insert(&U64::from(position_id), &position);
        self.settled_positions.insert(&U64::from(position_id));
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PositionSettled\",\"data\":{{\"position_id\":{},\"payout\":\"{}\"}}}}",
            position_id.0, payout
        ));
        // The escrow releases F; the fee accrues to the treasury from the
        // risk bucket's realised value (keeper sells before exit).
        ext_escrow::ext(self.escrow_account.clone())
            .with_static_gas(GAS_SETTLE)
            .release(
                U64::from(position_id),
                env::current_account_id(),
                U128(position.floor_amount),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_ESCROW_CALLBACK)
                    .on_settle_release(position_id.0, position.owner.clone(), U128(payout), prev_state),
            )
            .into()
    }

    /// `emergency_recover` — Degraded only: release the reserve and return
    /// unswapped quote. Works without the keeper (NF-06).
    pub fn emergency_recover(&mut self, position_id: U64) -> PromiseOrValue<U128> {
        self.assert_owner(position_id.0);
        let position = self
            .positions
            .get(&position_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        if position.state != PositionState::Degraded {
            env::panic_str("ErrBadState: emergency_recover is for Degraded positions");
        }

        let unswapped = position
            .risk_budget
            .checked_sub(position.cost_basis)
            .unwrap_or(0);
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PositionDegraded\",\"data\":{{\"position_id\":{},\"reason\":\"recovered\"}}}}",
            position_id.0
        ));
        ext_escrow::ext(self.escrow_account.clone())
            .with_static_gas(GAS_SETTLE)
            .release(
                U64::from(position_id),
                env::current_account_id(),
                U128(position.floor_amount),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_ESCROW_CALLBACK)
                    .on_settle_release(position_id.0, position.owner.clone(), U128(unswapped), "Degraded".to_string()),
            )
            .into()
    }

    /// Mark a position degraded — callable by anyone after the settlement
    /// timeout with a stuck buy (§4.4; NF-06 requires this to be keeperless).
    pub fn mark_degraded(&mut self, position_id: U64) {
        let mut position = self
            .positions
            .get(&position_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        if position.state == PositionState::Settled {
            env::panic_str("ErrBadState: already settled");
        }
        let age_ms = env::block_timestamp().saturating_sub(position.opened_at);
        if age_ms < u64::from(self.config.settlement_timeout_sec) * 1_000_000_000 {
            env::panic_str("ErrBadState: settlement timeout not reached");
        }
        position.state = PositionState::Degraded;
        self.positions.insert(&position_id, &position);
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PositionDegraded\",\"data\":{{\"position_id\":{},\"reason\":\"settlement_timeout\"}}}}",
            position_id.0
        ));
    }

    // ─── NEP-171 core (transfer/mint/burn semantics on positions) ───

    /// NEP-171 `nft_transfer` — moving the token moves the claim (F-13);
    /// settle pays the new owner.
    pub fn nft_transfer(
        &mut self,
        receiver_id: AccountId,
        token_id: U64,
        _approval_id: Option<u64>,
        _memo: Option<String>,
    ) {
        self.assert_owner(token_id.0);
        let mut position = self
            .positions
            .get(&token_id)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        let previous = position.owner.clone();
        if previous == receiver_id {
            env::panic_str("ErrBadState: cannot transfer to self");
        }
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PositionTransferred\",\"data\":{{\"position_id\":{},\"from\":\"{}\",\"to\":\"{}\"}}}}",
            token_id.0, previous, receiver_id
        ));

        position.owner = receiver_id.clone();
        self.positions.insert(&token_id, &position);

        let mut prev_vec = self
            .owner_positions
            .get(&previous)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        let keep: Vec<U64> = prev_vec.iter().filter(|v| v.0 != token_id.0).collect();
        prev_vec.clear();
        for v in keep {
            prev_vec.push(&v);
        }
        self.owner_positions.insert(&previous, &prev_vec);
        let mut ids = self
            .owner_positions
            .get(&receiver_id)
            .unwrap_or_else(|| Vector::new(b"owner_positions_v1".to_vec()));
        ids.push(&token_id);
        self.owner_positions.insert(&receiver_id, &ids);
    }

    /// NEP-171 `nft_transfer_call` — transfer-on-burn semantics are the
    /// escrow release path; direct transfer_call is rejected in v1.
    pub fn nft_transfer_call(
        &mut self,
        _receiver_id: AccountId,
        _token_id: U64,
        _approval_id: Option<u64>,
        _memo: Option<String>,
        _msg: String,
    ) -> PromiseOrValue<U128> {
        env::panic_str("ErrNotSupported: use nft_transfer then settle");
    }

    /// NEP-171 `nft_token`.
    pub fn nft_token(&self, token_id: U64) -> Option<PositionView> {
        self.positions
            .get(&token_id)
            .map(|p| self.to_view(token_id.0, &p))
    }

    /// NEP-171 `nft_tokens_for_owner`.
    pub fn nft_tokens_for_owner(&self, account_id: AccountId) -> Vec<PositionView> {
        self.positions_of_internal(&account_id)
            .into_iter()
            .map(|(id, p)| self.to_view(id, &p))
            .collect()
    }

    // ─── Admin ───

    /// Pause: deposits still accepted; buys and de-risks rejected (§4.7 #9).
    pub fn set_paused(&mut self, paused: bool) {
        self.assert_treasury();
        self.paused = paused;
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"floorline\",\"event\":\"PausedSet\",\"data\":{{\"value\":{}}}}}",
            paused
        ));
    }

    pub fn set_secondary_oracle(&mut self, account: AccountId) {
        self.assert_treasury();
        self.secondary_oracle = account;
    }

    // ─── Views (§6.2) ───

    pub fn get_position(&self, position_id: U64) -> Option<PositionView> {
        self.positions
            .get(&position_id)
            .map(|p| self.to_view(position_id.0, &p))
    }

    /// `position_state` — consumed by the escrow's release gate (I1).
    pub fn position_state(&self, position_id: u64) -> String {
        self.positions
            .get(&U64(position_id))
            .map(|p| p.state.as_str().to_string())
            .unwrap_or_else(|| "Settled".to_string()) // burned == Settled
    }

    pub fn positions_of(&self, account_id: AccountId) -> Vec<PositionView> {
        self.nft_tokens_for_owner(account_id)
    }

    /// `nav_of` — price supplied by the caller (1e18-scaled, view-only).
    pub fn nav_of(&self, position_id: U64, price_1e18: U128) -> U128 {
        self.positions
            .get(&position_id)
            .map(|p| U128(math::nav(&p, price_1e18.0, self.config.risk_decimals, self.config.quote_decimals)))
            .unwrap_or(U128(0))
    }

    /// `worst_case` = F + realised_quote (§6.2) — the depositor's floor.
    pub fn worst_case(&self, position_id: U64) -> U128 {
        self.positions
            .get(&position_id)
            .map(|p| U128(math::worst_case_quote(&p)))
            .unwrap_or(U128(0))
    }

    pub fn get_config(&self) -> VaultConfig {
        self.config.clone()
    }

    pub fn get_vault_state(&self) -> (bool, U128, U128) {
        (self.paused, U128(self.total_floor_locked), U128(self.total_deposited))
    }

    // ─── Internals ───

    fn positions_of_internal(&self, account: &AccountId) -> Vec<(u64, Position)> {
        self.owner_positions
            .get(account)
            .map(|vec| {
                vec.iter()
                    .filter_map(|id| self.positions.get(&id).map(|p| (id.0, p)))
                    .collect()
            })
            .unwrap_or_default()
    }

    fn to_view(&self, id: u64, p: &Position) -> PositionView {
        PositionView {
            position_id: id,
            owner: p.owner.clone(),
            deposit_amount: p.deposit_amount,
            floor_amount: p.floor_amount,
            risk_budget: p.risk_budget,
            risk_units: p.risk_units,
            cost_basis: p.cost_basis,
            realised_quote: p.realised_quote,
            de_risked: p.de_risked,
            opened_at: p.opened_at,
            matures_at: p.matures_at,
            state: p.state.as_str().to_string(),
            nav_quote: p.nav_quote,
        }
    }

    fn assert_owner(&self, position_id: u64) {
        let owner = self
            .positions
            .get(&U64(position_id))
            .map(|p| p.owner)
            .unwrap_or_else(|| env::panic_str("ErrPositionNotFound"));
        if owner != env::predecessor_account_id() {
            env::panic_str("ErrNotOwner");
        }
    }

    fn assert_treasury(&self) {
        if env::predecessor_account_id() != self.treasury {
            env::panic_str("ErrNotOwner: treasury only");
        }
    }

    fn assert_buy_preconditions(&self, price_1e18: U128, quote_timestamp_ms: Timestamp) {
        if self.paused {
            env::panic_str("ErrPaused: the vault is paused for buys and de-risks");
        }
        if price_1e18.0 == 0 {
            env::panic_str("ErrPriceStale: zero price");
        }
        let now_ms = env::block_timestamp() / 1_000_000; // ns → ms
        let age_ms = now_ms.saturating_sub(quote_timestamp_ms);
        if age_ms > u64::from(self.config.price_max_age_sec) * 1_000 {
            env::panic_str("ErrPriceStale");
        }
    }
}

#[cfg(all(test, feature = "unit-testing"))]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, AccountId};

    #[test]
    fn new_initializes_with_testnet_config() {
        let ctx = VMContextBuilder::new()
            .signer_account_id("floorline-demo.testnet".parse::<AccountId>().unwrap())
            .predecessor_account_id("floorline-demo.testnet".parse::<AccountId>().unwrap())
            .build();
        testing_env!(ctx);
        let vault = Vault::new(
            Some(VaultConfig::testnet()),
            Some("floorline-escrow.testnet".parse().unwrap()),
            Some("floorline-demo.testnet".parse().unwrap()),
            Some("oracles.testnet".parse().unwrap()),
        );
        let cfg = vault.get_config();
        assert_eq!(cfg.quote_asset_id, "wrap.testnet");
        assert_eq!(cfg.risk_asset_id, "nvda.floorline-escrow.testnet");
        assert_eq!(cfg.quote_decimals, 24);
        assert_eq!(cfg.risk_decimals, 6);
        assert_eq!(cfg.floor_ratio_bps, 9_000);
        let (paused, locked, deposited) = vault.get_vault_state();
        assert!(!paused);
        assert_eq!(locked.0, 0);
        assert_eq!(deposited.0, 0);
    }
}
