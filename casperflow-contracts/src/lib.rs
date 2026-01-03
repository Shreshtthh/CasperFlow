//! CasperFlow Smart Contracts
//!
//! A no-code automation platform for programmable liquid staking rewards on Casper.
//!
//! # Contracts
//! - **AutomationVault**: Holds user funds for automated operations
//! - **AutomationEngine**: Manages automation rules and execution
//! - **StakingAdapter**: Interfaces with Casper's native liquid staking

#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

pub mod errors;
pub mod events;
pub mod types;

pub mod vault;
pub mod automation_engine;
pub mod staking_adapter;

// Re-export main contracts for convenience
pub use vault::AutomationVault;
pub use automation_engine::AutomationEngine;
pub use staking_adapter::StakingAdapter;
