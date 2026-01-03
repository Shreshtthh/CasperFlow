//! CasperFlow Testnet Deployment Script
//!
//! Run with: cargo run --bin deploy --features livenet

use odra::host::Deployer;
use odra::prelude::Addressable;
use casperflow_contracts::vault::{AutomationVault, AutomationVaultInitArgs};
use casperflow_contracts::automation_engine::{AutomationEngine, AutomationEngineInitArgs};

fn main() {
    // Load environment from .env file
    dotenv::dotenv().ok();
    
    // Get the livenet environment (reads from ODRA_CASPER_LIVENET_* env vars)
    let env = odra_casper_livenet_env::env();
    
    println!("🚀 Deploying CasperFlow to Casper Testnet...\n");
    
    // Gas limit for contract deployment (300 CSPR = 300_000_000_000 motes)
    const DEPLOY_GAS: u64 = 500_000_000_000;
    // Gas limit for contract calls (10 CSPR)
    const CALL_GAS: u64 = 10_000_000_000;
    
    // Step 1: Deploy AutomationVault
    println!("📦 Deploying AutomationVault...");
    env.set_gas(DEPLOY_GAS);
    let vault = AutomationVault::deploy(&env, AutomationVaultInitArgs {
        automation_engine: None,
    });
    let vault_address = vault.address().clone();
    println!("✅ Vault deployed at: {:?}\n", vault_address);
    
    // Step 2: Deploy AutomationEngine with Vault address
    println!("📦 Deploying AutomationEngine...");
    env.set_gas(DEPLOY_GAS);
    let engine = AutomationEngine::deploy(&env, AutomationEngineInitArgs {
        vault_address: Some(vault_address.clone()),
    });
    let engine_address = engine.address().clone();
    println!("✅ Engine deployed at: {:?}\n", engine_address);
    
    // Step 3: Link Vault to Engine
    println!("🔗 Linking Vault to Engine...");
    env.set_gas(CALL_GAS);
    let mut vault_ref = vault;
    vault_ref.set_automation_engine(engine_address.clone());
    println!("✅ Vault linked to Engine\n");
    
    // Print summary
    println!("═══════════════════════════════════════════════════════════");
    println!("                   DEPLOYMENT COMPLETE                      ");
    println!("═══════════════════════════════════════════════════════════");
    println!("AutomationVault:  {:?}", vault_address);
    println!("AutomationEngine: {:?}", engine_address);
    println!("═══════════════════════════════════════════════════════════");
    println!("\n📋 Save these addresses for frontend integration!");
}
