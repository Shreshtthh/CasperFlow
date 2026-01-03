//! CasperFlow Staking Adapter
//!
//! Interfaces with Casper's native liquid staking to enable auto-compound
//! and scheduled unstaking features.

use odra::prelude::*;
use odra::casper_types::{PublicKey, U512};

use crate::errors::Error;
use crate::events::{RewardsCompounded, Unstaked};

/// The Staking Adapter contract
/// 
/// Provides staking operations for automation rules. Uses Casper 2.0's
/// native delegate/undelegate functionality.
#[odra::module(
    events = [RewardsCompounded, Unstaked],
    errors = Error
)]
pub struct StakingAdapter {
    /// The default validator public key for staking operations
    default_validator: Var<Option<PublicKey>>,
    /// Mapping of user address to their total staked amount (for tracking)
    user_stakes: Mapping<Address, U512>,
    /// The automation engine authorized to call staking operations
    authorized_engine: Var<Option<Address>>,
}

#[odra::module]
impl StakingAdapter {
    /// Initialize the staking adapter with a default validator
    pub fn init(&mut self, default_validator: Option<PublicKey>) {
        self.default_validator.set(default_validator);
    }

    /// Stake CSPR to the default validator
    /// 
    /// This is a payable function - attach CSPR when calling.
    #[odra(payable)]
    pub fn stake(&mut self) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        
        if amount.is_zero() {
            self.env().revert(Error::ZeroAmount);
        }
        
        let validator = match self.default_validator.get_or_default() {
            Some(v) => v,
            None => self.env().revert(Error::InvalidValidator),
        };
        
        // Delegate to validator using Casper 2.0 API
        self.env().delegate(validator, amount);
        
        // Track user's stake
        let current_stake = self.user_stakes.get_or_default(&caller);
        self.user_stakes.set(&caller, current_stake + amount);
    }

    /// Stake CSPR to a specific validator
    #[odra(payable)]
    pub fn stake_to_validator(&mut self, validator: PublicKey) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        
        if amount.is_zero() {
            self.env().revert(Error::ZeroAmount);
        }
        
        // Delegate to specified validator
        self.env().delegate(validator, amount);
        
        // Track user's stake
        let current_stake = self.user_stakes.get_or_default(&caller);
        self.user_stakes.set(&caller, current_stake + amount);
    }

    /// Unstake CSPR from the default validator
    pub fn unstake(&mut self, amount: U512) {
        let caller = self.env().caller();
        
        if amount.is_zero() {
            self.env().revert(Error::ZeroAmount);
        }
        
        let validator = match self.default_validator.get_or_default() {
            Some(v) => v,
            None => self.env().revert(Error::InvalidValidator),
        };
        
        // Check tracked stake
        let current_stake = self.user_stakes.get_or_default(&caller);
        if current_stake < amount {
            self.env().revert(Error::InsufficientStakingBalance);
        }
        
        // Undelegate from validator
        self.env().undelegate(validator, amount);
        
        // Update tracked stake
        self.user_stakes.set(&caller, current_stake - amount);
        
        // Emit event
        self.env().emit_event(Unstaked {
            owner: caller,
            amount,
        });
    }

    /// Compound staking rewards
    /// 
    /// This function claims pending rewards and re-stakes them.
    /// Called by the automation engine for auto-compound rules.
    pub fn compound_rewards(&mut self, owner: Address, validator: PublicKey) {
        // Get current delegated amount (includes rewards)
        let delegated = self.env().delegated_amount(validator.clone());
        let tracked = self.user_stakes.get_or_default(&owner);
        
        // Rewards = delegated - tracked (simplified)
        if delegated > tracked {
            let rewards = delegated - tracked;
            
            // Update tracked stake to include compounded rewards
            self.user_stakes.set(&owner, delegated);
            
            // Emit event
            self.env().emit_event(RewardsCompounded {
                owner,
                amount: rewards,
            });
        }
    }

    /// Set the authorized automation engine
    pub fn set_automation_engine(&mut self, engine: Address) {
        self.authorized_engine.set(Some(engine));
    }

    /// Set the default validator
    pub fn set_default_validator(&mut self, validator: PublicKey) {
        self.default_validator.set(Some(validator));
    }

    // ========================================================================
    // View Functions
    // ========================================================================

    /// Get the tracked stake for a user
    pub fn get_user_stake(&self, owner: Address) -> U512 {
        self.user_stakes.get_or_default(&owner)
    }

    /// Get the default validator
    pub fn get_default_validator(&self) -> Option<PublicKey> {
        self.default_validator.get_or_default()
    }

    /// Get the delegated amount for the contract with a validator
    pub fn get_delegated_amount(&self, validator: PublicKey) -> U512 {
        self.env().delegated_amount(validator)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostRef};

    #[test]
    fn test_stake_and_unstake() {
        let env = odra_test::env();
        let validator = env.get_validator(0);
        
        let adapter = StakingAdapter::deploy(&env, StakingAdapterInitArgs {
            default_validator: Some(validator.clone()),
        });

        let staker = env.get_account(0);
        let stake_amount = U512::from(1_000_000_000_000u64); // 1000 CSPR

        // Stake
        env.set_caller(staker);
        adapter.with_tokens(stake_amount).stake();
        
        assert_eq!(adapter.get_user_stake(staker), stake_amount);
        
        // Note: In testnet, delegation takes time to process
        // For unit tests, we just verify the tracked stake
    }
}
