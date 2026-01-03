//! CasperFlow Custom Types
//!
//! Defines the data structures used for automation rules.

use odra::prelude::*;
use odra::casper_types::U512;

/// The type of trigger that activates a rule
#[odra::odra_type]
pub enum TriggerType {
    /// Time-based trigger (scheduled execution)
    Time = 0,
    /// Condition-based trigger (e.g., balance threshold)
    Condition = 1,
    /// Manual trigger only
    Manual = 2,
}

/// The frequency of scheduled executions
#[odra::odra_type]
pub enum Schedule {
    /// Execute daily
    Daily = 0,
    /// Execute weekly
    Weekly = 1,
    /// Execute monthly
    Monthly = 2,
}

/// The type of action to perform
#[odra::odra_type]
pub enum ActionType {
    /// Transfer tokens to a recipient
    Transfer = 0,
    /// Split tokens among multiple recipients
    Split = 1,
    /// Compound staking rewards
    Compound = 2,
}

/// The status of a rule
#[odra::odra_type]
pub enum RuleStatus {
    /// Rule is active and will execute
    Active = 0,
    /// Rule is paused
    Paused = 1,
    /// Rule has been deleted
    Deleted = 2,
}

/// Configuration for a transfer action
#[odra::odra_type]
pub struct TransferAction {
    pub recipient: Address,
    pub amount: U512,
}

/// Configuration for a split action (percentage-based)
#[odra::odra_type]
pub struct SplitRecipient {
    pub recipient: Address,
    pub percentage: u8, // 0-100
}

/// Complete automation rule stored on-chain
#[odra::odra_type]
pub struct AutomationRule {
    /// Unique identifier for this rule
    pub id: u64,
    /// Owner of the rule
    pub owner: Address,
    /// Type of trigger
    pub trigger_type: TriggerType,
    /// Schedule for time-based triggers
    pub schedule: Schedule,
    /// Type of action
    pub action_type: ActionType,
    /// Current status
    pub status: RuleStatus,
    /// Template name for display purposes
    pub template_name: String,
    /// Recipient address (for Transfer action)
    pub recipient: Option<Address>,
    /// Amount (for Transfer action), or minimum balance condition
    pub amount: U512,
    /// Timestamp of last execution
    pub last_executed: u64,
    /// Timestamp of next scheduled execution
    pub next_execution: u64,
    /// Total number of successful executions
    pub execution_count: u32,
}

impl AutomationRule {
    /// Create a new rule with default values
    pub fn new(
        id: u64,
        owner: Address,
        template_name: String,
        trigger_type: TriggerType,
        schedule: Schedule,
        action_type: ActionType,
        recipient: Option<Address>,
        amount: U512,
        next_execution: u64,
    ) -> Self {
        Self {
            id,
            owner,
            trigger_type,
            schedule,
            action_type,
            status: RuleStatus::Active,
            template_name,
            recipient,
            amount,
            last_executed: 0,
            next_execution,
            execution_count: 0,
        }
    }
}

/// User tier based on sCSPR holdings
#[odra::odra_type]
pub enum StakingTier {
    /// Free tier: 0+ sCSPR, max 2 rules
    Starter = 0,
    /// Bronze: 100+ sCSPR, max 5 rules
    Bronze = 1,
    /// Silver: 500+ sCSPR, max 10 rules
    Silver = 2,
    /// Gold: 1000+ sCSPR, unlimited rules
    Gold = 3,
}

impl StakingTier {
    /// Get the maximum number of rules allowed for this tier
    pub fn max_rules(&self) -> u32 {
        match self {
            StakingTier::Starter => 2,
            StakingTier::Bronze => 5,
            StakingTier::Silver => 10,
            StakingTier::Gold => u32::MAX,
        }
    }
    
    /// Determine tier based on sCSPR balance (in motes)
    pub fn from_balance(balance: U512) -> Self {
        let cspr_1000 = U512::from(1_000_000_000_000u64); // 1000 CSPR in motes
        let cspr_500 = U512::from(500_000_000_000u64);    // 500 CSPR
        let cspr_100 = U512::from(100_000_000_000u64);    // 100 CSPR
        
        if balance >= cspr_1000 {
            StakingTier::Gold
        } else if balance >= cspr_500 {
            StakingTier::Silver
        } else if balance >= cspr_100 {
            StakingTier::Bronze
        } else {
            StakingTier::Starter
        }
    }
}
