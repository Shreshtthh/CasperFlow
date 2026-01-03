//! CasperFlow Error Types
//! 
//! Defines all error codes used across the CasperFlow contracts.

use odra::prelude::*;

/// Errors for the CasperFlow contracts
#[odra::odra_error]
pub enum Error {
    // Vault Errors (1-99)
    /// Insufficient balance in vault for withdrawal
    InsufficientBalance = 1,
    /// Caller is not the vault owner
    NotVaultOwner = 2,
    /// Caller is not authorized to execute from vault
    UnauthorizedExecutor = 3,
    /// Zero amount is not allowed
    ZeroAmount = 4,
    
    // Automation Engine Errors (100-199)
    /// Rule not found
    RuleNotFound = 100,
    /// Caller is not the rule owner
    NotRuleOwner = 101,
    /// Rule is not active
    RuleNotActive = 102,
    /// Rule is already paused
    RuleAlreadyPaused = 103,
    /// Rule is not paused
    RuleNotPaused = 104,
    /// Condition not met for execution
    ConditionNotMet = 105,
    /// Invalid rule configuration
    InvalidRuleConfig = 106,
    /// Maximum rules limit reached for user tier
    MaxRulesReached = 107,
    /// Trigger time not yet reached
    TriggerTimeNotReached = 108,
    
    // Staking Errors (200-299)
    /// Insufficient staking balance
    InsufficientStakingBalance = 200,
    /// Invalid validator public key
    InvalidValidator = 201,
    /// Minimum stake amount not met
    MinimumStakeNotMet = 202,
}
