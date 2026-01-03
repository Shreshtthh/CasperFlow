//! CasperFlow Automation Vault
//!
//! A secure vault contract that holds user funds for automated operations.
//! Users deposit CSPR into their vault, and authorized automation contracts
//! can execute transfers on their behalf.

use odra::prelude::*;
use odra::casper_types::U512;

use crate::errors::Error;
use crate::events::{Deposited, Withdrawn, AutomationExecuted};

/// The Automation Vault contract
/// 
/// Each user has a dedicated vault balance. The vault holds CSPR tokens
/// that can be used by automation rules to execute transfers.
#[odra::module(
    events = [Deposited, Withdrawn, AutomationExecuted],
    errors = Error
)]
pub struct AutomationVault {
    /// Mapping of user address to their CSPR balance in the vault
    balances: Mapping<Address, U512>,
    /// The automation engine contract authorized to execute transfers
    authorized_engine: Var<Option<Address>>,
}

#[odra::module]
impl AutomationVault {
    /// Initialize the vault with an optional automation engine address
    /// The engine address can be set later if not known at deploy time
    pub fn init(&mut self, automation_engine: Option<Address>) {
        self.authorized_engine.set(automation_engine);
    }

    /// Deposit CSPR into the caller's vault
    /// 
    /// This is a payable function - attach CSPR when calling.
    #[odra(payable)]
    pub fn deposit(&mut self) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        
        if amount.is_zero() {
            self.env().revert(Error::ZeroAmount);
        }
        
        // Update balance
        let current_balance = self.balances.get_or_default(&caller);
        let new_balance = current_balance + amount;
        self.balances.set(&caller, new_balance);
        
        // Emit event
        self.env().emit_event(Deposited {
            owner: caller,
            amount,
            new_balance,
        });
    }

    /// Withdraw CSPR from the caller's vault to their account
    pub fn withdraw(&mut self, amount: U512) {
        let caller = self.env().caller();
        
        if amount.is_zero() {
            self.env().revert(Error::ZeroAmount);
        }
        
        // Check balance
        let current_balance = self.balances.get_or_default(&caller);
        if current_balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }
        
        // Update balance
        let new_balance = current_balance - amount;
        self.balances.set(&caller, new_balance);
        
        // Transfer to caller
        self.env().transfer_tokens(&caller, &amount);
        
        // Emit event
        self.env().emit_event(Withdrawn {
            owner: caller,
            amount,
            new_balance,
        });
    }

    /// Execute a transfer from a user's vault (called by automation engine)
    /// 
    /// This function can only be called by the authorized automation engine.
    /// It transfers funds from the owner's vault to the specified recipient.
    pub fn execute_transfer(
        &mut self,
        owner: Address,
        recipient: Address,
        amount: U512,
        rule_id: u64,
    ) {
        let caller = self.env().caller();
        
        // Verify caller is the authorized automation engine
        let authorized = self.authorized_engine.get_or_default();
        match authorized {
            Some(engine_addr) => {
                if caller != engine_addr {
                    self.env().revert(Error::UnauthorizedExecutor);
                }
            }
            None => {
                self.env().revert(Error::UnauthorizedExecutor);
            }
        }
        
        // Check balance
        let current_balance = self.balances.get_or_default(&owner);
        if current_balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }
        
        // Update balance
        let new_balance = current_balance - amount;
        self.balances.set(&owner, new_balance);
        
        // Transfer to recipient
        self.env().transfer_tokens(&recipient, &amount);
        
        // Emit event
        self.env().emit_event(AutomationExecuted {
            owner,
            rule_id,
            recipient,
            amount,
        });
    }

    /// Set the authorized automation engine address
    /// This should only be callable once or by an admin in production
    pub fn set_automation_engine(&mut self, engine: Address) {
        // For MVP, anyone can set this. In production, add access control.
        self.authorized_engine.set(Some(engine));
    }

    // ========================================================================
    // View Functions
    // ========================================================================

    /// Get the vault balance for a specific address
    pub fn get_balance(&self, owner: Address) -> U512 {
        self.balances.get_or_default(&owner)
    }

    /// Get the authorized automation engine address
    pub fn get_automation_engine(&self) -> Option<Address> {
        self.authorized_engine.get_or_default()
    }

    /// Get the contract's total CSPR balance
    pub fn get_contract_balance(&self) -> U512 {
        self.env().self_balance()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostRef};

    #[test]
    fn test_deposit_and_withdraw() {
        let env = odra_test::env();
        let mut vault = AutomationVault::deploy(&env, AutomationVaultInitArgs {
            automation_engine: None,
        });

        let depositor = env.get_account(0);
        let deposit_amount = U512::from(1_000_000_000u64); // 1 CSPR

        // Deposit
        env.set_caller(depositor);
        vault.with_tokens(deposit_amount).deposit();
        
        assert_eq!(vault.get_balance(depositor), deposit_amount);

        // Withdraw half
        let withdraw_amount = U512::from(500_000_000u64);
        vault.withdraw(withdraw_amount);
        
        assert_eq!(vault.get_balance(depositor), deposit_amount - withdraw_amount);
    }

    #[test]
    fn test_insufficient_balance() {
        let env = odra_test::env();
        let mut vault = AutomationVault::deploy(&env, AutomationVaultInitArgs {
            automation_engine: None,
        });

        let depositor = env.get_account(0);
        let deposit_amount = U512::from(100_000_000u64);
        let withdraw_amount = U512::from(200_000_000u64);

        // Deposit
        env.set_caller(depositor);
        vault.with_tokens(deposit_amount).deposit();

        // Try to withdraw more than deposited
        let result = vault.try_withdraw(withdraw_amount);
        assert!(result.is_err());
    }
}
