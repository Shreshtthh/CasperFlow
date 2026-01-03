//! CasperFlow Automation Engine
//!
//! The core contract that manages automation rules. Users can create, pause,
//! resume, and delete rules. A keeper network (or cron trigger) calls
//! execute_due_rules() to run scheduled automations.

use odra::prelude::*;
use odra::casper_types::U512;
use odra::ContractRef;

use crate::errors::Error;
use crate::events::{RuleCreated, RulePaused, RuleResumed, RuleDeleted, RuleExecuted};
use crate::types::{AutomationRule, TriggerType, Schedule, ActionType, RuleStatus, StakingTier};
use crate::vault::AutomationVaultContractRef;

/// Seconds in a day (for scheduling)
const SECONDS_PER_DAY: u64 = 86_400;
/// Seconds in a week
const SECONDS_PER_WEEK: u64 = 604_800;
/// Seconds in a month (approximate: 30 days)
const SECONDS_PER_MONTH: u64 = 2_592_000;

/// The Automation Engine contract
/// 
/// Manages automation rules for all users. Each rule specifies a trigger,
/// conditions, and actions to execute.
#[odra::module(
    events = [RuleCreated, RulePaused, RuleResumed, RuleDeleted, RuleExecuted],
    errors = Error
)]
pub struct AutomationEngine {
    /// Counter for generating unique rule IDs
    next_rule_id: Var<u64>,
    /// Mapping of rule ID to rule data
    rules: Mapping<u64, AutomationRule>,
    /// Mapping of user address to their rule IDs
    user_rules: Mapping<Address, Vec<u64>>,
    /// Mapping of user address to their rule count (for tier limits)
    user_rule_count: Mapping<Address, u32>,
    /// The vault contract address for executing transfers
    vault_address: Var<Option<Address>>,
}

#[odra::module]
impl AutomationEngine {
    /// Initialize the automation engine with the vault address
    pub fn init(&mut self, vault_address: Option<Address>) {
        self.next_rule_id.set(1);
        self.vault_address.set(vault_address);
    }

    /// Create a new automation rule
    /// 
    /// # Arguments
    /// * `template_name` - Name of the template (e.g., "recurring_payment")
    /// * `trigger_type` - When the rule triggers (Time, Condition, Manual)
    /// * `schedule` - Frequency for time-based triggers
    /// * `action_type` - What action to perform
    /// * `recipient` - Target address for transfers (optional for compound)
    /// * `amount` - Amount to transfer per execution
    pub fn create_rule(
        &mut self,
        template_name: String,
        trigger_type: TriggerType,
        schedule: Schedule,
        action_type: ActionType,
        recipient: Option<Address>,
        amount: U512,
    ) -> u64 {
        let caller = self.env().caller();
        let current_time = self.env().get_block_time();
        
        // Check tier limits
        let current_count = self.user_rule_count.get_or_default(&caller);
        let tier = self.get_user_tier(caller);
        if current_count >= tier.max_rules() {
            self.env().revert(Error::MaxRulesReached);
        }
        
        // Generate rule ID
        let rule_id = self.next_rule_id.get_or_default();
        self.next_rule_id.set(rule_id + 1);
        
        // Calculate next execution time
        let next_execution = self.calculate_next_execution(current_time, &schedule);
        
        // Create rule
        let rule = AutomationRule::new(
            rule_id,
            caller,
            template_name.clone(),
            trigger_type,
            schedule,
            action_type,
            recipient,
            amount,
            next_execution,
        );
        
        // Store rule
        self.rules.set(&rule_id, rule);
        
        // Update user's rule list
        let mut user_rule_ids = self.user_rules.get_or_default(&caller);
        user_rule_ids.push(rule_id);
        self.user_rules.set(&caller, user_rule_ids);
        
        // Update rule count
        self.user_rule_count.set(&caller, current_count + 1);
        
        // Emit event
        self.env().emit_event(RuleCreated {
            rule_id,
            owner: caller,
            template_type: template_name,
        });
        
        rule_id
    }

    /// Pause an active rule
    pub fn pause_rule(&mut self, rule_id: u64) {
        let caller = self.env().caller();
        let mut rule = self.get_rule_or_revert(rule_id);
        
        // Verify ownership
        if rule.owner != caller {
            self.env().revert(Error::NotRuleOwner);
        }
        
        // Check current status
        match rule.status {
            RuleStatus::Paused => self.env().revert(Error::RuleAlreadyPaused),
            RuleStatus::Deleted => self.env().revert(Error::RuleNotFound),
            RuleStatus::Active => {}
        }
        
        // Update status
        rule.status = RuleStatus::Paused;
        self.rules.set(&rule_id, rule);
        
        // Emit event
        self.env().emit_event(RulePaused {
            rule_id,
            owner: caller,
        });
    }

    /// Resume a paused rule
    pub fn resume_rule(&mut self, rule_id: u64) {
        let caller = self.env().caller();
        let mut rule = self.get_rule_or_revert(rule_id);
        
        // Verify ownership
        if rule.owner != caller {
            self.env().revert(Error::NotRuleOwner);
        }
        
        // Check current status
        match rule.status {
            RuleStatus::Active => self.env().revert(Error::RuleNotPaused),
            RuleStatus::Deleted => self.env().revert(Error::RuleNotFound),
            RuleStatus::Paused => {}
        }
        
        // Update status and reschedule
        let current_time = self.env().get_block_time();
        rule.status = RuleStatus::Active;
        rule.next_execution = self.calculate_next_execution(current_time, &rule.schedule);
        self.rules.set(&rule_id, rule);
        
        // Emit event
        self.env().emit_event(RuleResumed {
            rule_id,
            owner: caller,
        });
    }

    /// Delete a rule permanently
    pub fn delete_rule(&mut self, rule_id: u64) {
        let caller = self.env().caller();
        let mut rule = self.get_rule_or_revert(rule_id);
        
        // Verify ownership
        if rule.owner != caller {
            self.env().revert(Error::NotRuleOwner);
        }
        
        // Mark as deleted
        rule.status = RuleStatus::Deleted;
        self.rules.set(&rule_id, rule);
        
        // Decrement rule count
        let current_count = self.user_rule_count.get_or_default(&caller);
        if current_count > 0 {
            self.user_rule_count.set(&caller, current_count - 1);
        }
        
        // Emit event
        self.env().emit_event(RuleDeleted {
            rule_id,
            owner: caller,
        });
    }

    /// Execute a specific rule (called by keeper/cron)
    /// 
    /// This function checks if the rule is due for execution and performs
    /// the configured action via the vault contract.
    pub fn execute_rule(&mut self, rule_id: u64) {
        let current_time = self.env().get_block_time();
        let mut rule = self.get_rule_or_revert(rule_id);
        
        // Check if rule is active
        match rule.status {
            RuleStatus::Active => {}
            _ => self.env().revert(Error::RuleNotActive),
        }
        
        // Check if time-based trigger is due
        match rule.trigger_type {
            TriggerType::Time => {
                if current_time < rule.next_execution {
                    self.env().revert(Error::TriggerTimeNotReached);
                }
            }
            TriggerType::Manual => {
                // Manual triggers can be executed anytime by the owner
                let caller = self.env().caller();
                if rule.owner != caller {
                    self.env().revert(Error::NotRuleOwner);
                }
            }
            TriggerType::Condition => {
                // For condition-based, we'll check in future versions
                // For now, treat similar to manual
            }
        }
        
        // Execute the action
        match rule.action_type {
            ActionType::Transfer => {
                self.execute_transfer(&rule);
            }
            ActionType::Split => {
                // Split transfers - simplified for MVP (single recipient)
                self.execute_transfer(&rule);
            }
            ActionType::Compound => {
                // Compound action - will be implemented with staking adapter
                // For now, this is a no-op placeholder
            }
        }
        
        // Update rule state
        rule.last_executed = current_time;
        rule.next_execution = self.calculate_next_execution(current_time, &rule.schedule);
        rule.execution_count += 1;
        self.rules.set(&rule_id, rule.clone());
        
        // Emit event
        self.env().emit_event(RuleExecuted {
            rule_id,
            owner: rule.owner,
            executed_at: current_time,
        });
    }

    /// Set the vault contract address
    pub fn set_vault_address(&mut self, vault: Address) {
        self.vault_address.set(Some(vault));
    }

    // ========================================================================
    // View Functions
    // ========================================================================

    /// Get a rule by ID
    pub fn get_rule(&self, rule_id: u64) -> Option<AutomationRule> {
        self.rules.get(&rule_id)
    }

    /// Get all rule IDs for a user
    pub fn get_user_rule_ids(&self, owner: Address) -> Vec<u64> {
        self.user_rules.get_or_default(&owner)
    }

    /// Get the user's current tier (placeholder - returns Starter for MVP)
    pub fn get_user_tier(&self, _owner: Address) -> StakingTier {
        // In production, this would query sCSPR balance
        // For MVP, everyone gets Starter tier (2 rules max)
        StakingTier::Starter
    }

    /// Get the number of active rules for a user
    pub fn get_user_rule_count(&self, owner: Address) -> u32 {
        self.user_rule_count.get_or_default(&owner)
    }

    /// Get the vault address
    pub fn get_vault_address(&self) -> Option<Address> {
        self.vault_address.get_or_default()
    }

    // ========================================================================
    // Internal Functions
    // ========================================================================

    /// Get a rule or revert if not found
    fn get_rule_or_revert(&self, rule_id: u64) -> AutomationRule {
        match self.rules.get(&rule_id) {
            Some(rule) => rule,
            None => {
                self.env().revert(Error::RuleNotFound);
            }
        }
    }

    /// Calculate the next execution time based on schedule
    fn calculate_next_execution(&self, from_time: u64, schedule: &Schedule) -> u64 {
        match schedule {
            Schedule::Daily => from_time + SECONDS_PER_DAY,
            Schedule::Weekly => from_time + SECONDS_PER_WEEK,
            Schedule::Monthly => from_time + SECONDS_PER_MONTH,
        }
    }

    /// Execute a transfer action via the vault
    fn execute_transfer(&self, rule: &AutomationRule) {
        let vault_addr = match self.vault_address.get_or_default() {
            Some(addr) => addr,
            None => self.env().revert(Error::InvalidRuleConfig),
        };
        
        let recipient = match rule.recipient {
            Some(addr) => addr,
            None => self.env().revert(Error::InvalidRuleConfig),
        };
        
        // Call vault contract to execute transfer
        let mut vault = AutomationVaultContractRef::new(self.env(), vault_addr);
        vault.execute_transfer(rule.owner, recipient, rule.amount, rule.id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::Deployer;
    use crate::vault::{AutomationVault, AutomationVaultHostRef, AutomationVaultInitArgs};

    fn setup() -> (odra::host::HostEnv, AutomationVaultHostRef, AutomationEngineHostRef) {
        let env = odra_test::env();
        
        // Deploy vault first
        let vault = AutomationVault::deploy(&env, AutomationVaultInitArgs {
            automation_engine: None,
        });
        
        // Deploy engine with vault address
        let engine = AutomationEngine::deploy(&env, AutomationEngineInitArgs {
            vault_address: Some(vault.address().clone()),
        });
        
        // Set engine as authorized in vault
        let mut vault_mut = vault;
        vault_mut.set_automation_engine(engine.address().clone());
        
        (env, vault_mut, engine)
    }

    #[test]
    fn test_create_rule() {
        let (env, _vault, mut engine) = setup();
        let user = env.get_account(0);
        env.set_caller(user);
        
        let rule_id = engine.create_rule(
            "recurring_payment".to_string(),
            TriggerType::Time,
            Schedule::Daily,
            ActionType::Transfer,
            Some(env.get_account(1)),
            U512::from(100_000_000u64),
        );
        
        assert_eq!(rule_id, 1);
        
        let rule = engine.get_rule(rule_id);
        assert!(rule.is_some());
        assert_eq!(rule.unwrap().owner, user);
    }

    #[test]
    fn test_pause_and_resume() {
        let (env, _vault, mut engine) = setup();
        let user = env.get_account(0);
        env.set_caller(user);
        
        let rule_id = engine.create_rule(
            "test_rule".to_string(),
            TriggerType::Manual,
            Schedule::Daily,
            ActionType::Transfer,
            Some(env.get_account(1)),
            U512::from(100_000_000u64),
        );
        
        // Pause
        engine.pause_rule(rule_id);
        let rule = engine.get_rule(rule_id).unwrap();
        assert!(matches!(rule.status, RuleStatus::Paused));
        
        // Resume
        engine.resume_rule(rule_id);
        let rule = engine.get_rule(rule_id).unwrap();
        assert!(matches!(rule.status, RuleStatus::Active));
    }

    #[test]
    fn test_tier_limit() {
        let (env, _vault, mut engine) = setup();
        let user = env.get_account(0);
        env.set_caller(user);
        
        // Starter tier allows 2 rules
        for i in 0..2 {
            engine.create_rule(
                format!("rule_{}", i),
                TriggerType::Manual,
                Schedule::Daily,
                ActionType::Transfer,
                Some(env.get_account(1)),
                U512::from(100_000_000u64),
            );
        }
        
        // Third rule should fail
        let result = engine.try_create_rule(
            "rule_3".to_string(),
            TriggerType::Manual,
            Schedule::Daily,
            ActionType::Transfer,
            Some(env.get_account(1)),
            U512::from(100_000_000u64),
        );
        
        assert!(result.is_err());
    }
}
