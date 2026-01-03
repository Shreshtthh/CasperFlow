//! CasperFlow Events
//!
//! Defines all events emitted by the CasperFlow contracts.

use odra::prelude::*;
use odra::casper_types::U512;

// ============================================================================
// Vault Events
// ============================================================================

/// Emitted when tokens are deposited into a vault
#[odra::event]
pub struct Deposited {
    pub owner: Address,
    pub amount: U512,
    pub new_balance: U512,
}

/// Emitted when tokens are withdrawn from a vault
#[odra::event]
pub struct Withdrawn {
    pub owner: Address,
    pub amount: U512,
    pub new_balance: U512,
}

/// Emitted when an automation executes a transfer from the vault
#[odra::event]
pub struct AutomationExecuted {
    pub owner: Address,
    pub rule_id: u64,
    pub recipient: Address,
    pub amount: U512,
}

// ============================================================================
// Automation Engine Events
// ============================================================================

/// Emitted when a new automation rule is created
#[odra::event]
pub struct RuleCreated {
    pub rule_id: u64,
    pub owner: Address,
    pub template_type: String,
}

/// Emitted when a rule is paused
#[odra::event]
pub struct RulePaused {
    pub rule_id: u64,
    pub owner: Address,
}

/// Emitted when a rule is resumed
#[odra::event]
pub struct RuleResumed {
    pub rule_id: u64,
    pub owner: Address,
}

/// Emitted when a rule is deleted
#[odra::event]
pub struct RuleDeleted {
    pub rule_id: u64,
    pub owner: Address,
}

/// Emitted when a rule is successfully executed
#[odra::event]
pub struct RuleExecuted {
    pub rule_id: u64,
    pub owner: Address,
    pub executed_at: u64,
}

/// Emitted when a rule execution fails
#[odra::event]
pub struct RuleExecutionFailed {
    pub rule_id: u64,
    pub owner: Address,
    pub error_code: u32,
}

// ============================================================================
// Staking Events
// ============================================================================

/// Emitted when rewards are compounded
#[odra::event]
pub struct RewardsCompounded {
    pub owner: Address,
    pub amount: U512,
}

/// Emitted when tokens are unstaked
#[odra::event]
pub struct Unstaked {
    pub owner: Address,
    pub amount: U512,
}
