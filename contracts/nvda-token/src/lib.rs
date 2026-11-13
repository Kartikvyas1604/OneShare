//! NVDA testnet stand-in — a real NEP-141 token so the Floorline risk leg can
//! hold NVIDIA-labeled units on testnet while Ondo's NVDAon is not yet listed
//! on 1Click (G-2). Production note: when the real NVDAon lists, the vault
//! config points at it and this stand-in retires.

use near_contract_standards::fungible_token::metadata::{
    FungibleTokenMetadata, FungibleTokenMetadataProvider, FT_METADATA_SPEC,
};
use near_contract_standards::fungible_token::FungibleToken;
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::LazyOption;
use near_sdk::json_types::U128;
use near_sdk::{
    env, log, near, AccountId, PanicOnDefault, Promise, PromiseOrValue,
};

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    token: FungibleToken,
    metadata: LazyOption<FungibleTokenMetadata>,
    /// The account that may mint (the testnet deployer/faucet leg).
    owner_id: AccountId,
}

#[near]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId, total_supply: U128) -> Self {
        let metadata = FungibleTokenMetadata {
            spec: FT_METADATA_SPEC.to_string(),
            name: "NVIDIA (Floorline testnet stand-in)".to_string(),
            symbol: "nNVDA".to_string(),
            decimals: 6,
            icon: None,
            reference: None,
            reference_hash: None,
        };
        let mut token = FungibleToken::new(b"ft".to_vec());
        token.internal_register_account(&owner_id);
        token.internal_deposit(&owner_id, total_supply.0);
        Self {
            token,
            metadata: LazyOption::new(b"meta".to_vec(), Some(&metadata)),
            owner_id,
        }
    }

    /// Mint new tokens to an account (owner only — the testnet faucet leg).
    pub fn mint(&mut self, account_id: AccountId, amount: U128) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "ErrOwnerOnly");
        self.token.internal_register_account(&account_id);
        self.token.internal_deposit(&account_id, amount.0);
        log!("mint");
    }

    /// One-time registration on the token contract (covers storage).
    pub fn register(&mut self, account_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "ErrOwnerOnly");
        self.token.internal_register_account(&account_id);
    }
}

/// NEP-141 core + receiver + resolver + metadata (all on one impl block).
#[near]
impl near_contract_standards::fungible_token::core::FungibleTokenCore for Contract {
    #[payable]
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        self.token.ft_transfer(receiver_id, amount, memo);
    }

    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}

#[near]
impl near_contract_standards::fungible_token::receiver::FungibleTokenReceiver for Contract {
    fn ft_on_transfer(
        &mut self,
        _sender_id: AccountId,
        amount: U128,
        _msg: String,
    ) -> PromiseOrValue<U128> {
        env::panic_str("ErrNotSupported: tokens must not be transfer-called into the token contract");
        #[allow(unreachable_code)]
        PromiseOrValue::Value(amount)
    }
}

#[near]
impl near_contract_standards::fungible_token::resolver::FungibleTokenResolver for Contract {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        self.token
            .internal_ft_resolve_transfer(&sender_id, receiver_id, amount)
            .0
            .into()
    }
}

#[near]
impl FungibleTokenMetadataProvider for Contract {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        self.metadata.get().unwrap()
    }
}
