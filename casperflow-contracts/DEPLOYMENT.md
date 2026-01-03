# CasperFlow Testnet Deployment Guide

## Prerequisites

1. **Casper Client** installed:
   ```bash
   # Check if installed
   casper-client --version
   
   # If not, install via cargo
   cargo install casper-client
   ```

2. **Testnet Account** with CSPR:
   - Get testnet CSPR from faucet: https://testnet.cspr.live/tools/faucet
   - You need your `secret_key.pem` file

3. **Testnet Node Address**:
   - Public: `http://65.21.235.219:7777` (or use https://testnet.cspr.live RPC)

---

## Deployment Order

Deploy contracts in this order (dependencies matter):

1. **AutomationVault** (no dependencies)
2. **AutomationEngine** (needs Vault's package hash)
3. **StakingAdapter** (optional, can deploy later)

---

## Step 1: Deploy AutomationVault

```bash
casper-client put-deploy \
  --node-address http://65.21.235.219:7777 \
  --chain-name casper-test \
  --secret-key /path/to/your/secret_key.pem \
  --payment-amount 150000000000 \
  --session-path ./wasm/AutomationVault.wasm \
  --session-arg "odra_cfg_package_hash_key_name:string='casperflow_vault'" \
  --session-arg "odra_cfg_allow_key_override:bool='false'" \
  --session-arg "odra_cfg_is_upgradable:bool='true'" \
  --session-arg "odra_cfg_is_upgrade:bool='false'" \
  --session-arg "automation_engine:opt_key=null"
```

**Save the deploy hash**, then check status:
```bash
casper-client get-deploy \
  --node-address http://65.21.235.219:7777 \
  <DEPLOY_HASH>
```

**Get the package hash** from your account's named keys:
```bash
casper-client get-account-info \
  --node-address http://65.21.235.219:7777 \
  --public-key /path/to/your/public_key.pem
```

Look for `casperflow_vault` in named_keys → this is your **VAULT_PACKAGE_HASH**.

---

## Step 2: Deploy AutomationEngine

Replace `<VAULT_PACKAGE_HASH>` with the hash from Step 1:

```bash
casper-client put-deploy \
  --node-address http://65.21.235.219:7777 \
  --chain-name casper-test \
  --secret-key /path/to/your/secret_key.pem \
  --payment-amount 200000000000 \
  --session-path ./wasm/AutomationEngine.wasm \
  --session-arg "odra_cfg_package_hash_key_name:string='casperflow_engine'" \
  --session-arg "odra_cfg_allow_key_override:bool='false'" \
  --session-arg "odra_cfg_is_upgradable:bool='true'" \
  --session-arg "odra_cfg_is_upgrade:bool='false'" \
  --session-arg "vault_address:opt_key='<VAULT_PACKAGE_HASH>'"
```

Get the **ENGINE_PACKAGE_HASH** from named keys.

---

## Step 3: Link Vault to Engine

After deploying both, call `set_automation_engine` on the Vault:

```bash
casper-client put-deploy \
  --node-address http://65.21.235.219:7777 \
  --chain-name casper-test \
  --secret-key /path/to/your/secret_key.pem \
  --payment-amount 5000000000 \
  --session-package-name "casperflow_vault" \
  --session-entry-point "set_automation_engine" \
  --session-arg "engine:key='<ENGINE_PACKAGE_HASH>'"
```

---

## Step 4: Deploy StakingAdapter (Optional)

```bash
casper-client put-deploy \
  --node-address http://65.21.235.219:7777 \
  --chain-name casper-test \
  --secret-key /path/to/your/secret_key.pem \
  --payment-amount 150000000000 \
  --session-path ./wasm/StakingAdapter.wasm \
  --session-arg "odra_cfg_package_hash_key_name:string='casperflow_staking'" \
  --session-arg "odra_cfg_allow_key_override:bool='false'" \
  --session-arg "odra_cfg_is_upgradable:bool='true'" \
  --session-arg "odra_cfg_is_upgrade:bool='false'" \
  --session-arg "default_validator:opt_public_key=null"
```

---

## Contract Hashes to Share

After deployment, share these with me for frontend integration:

| Contract | Package Hash |
|----------|--------------|
| AutomationVault | `hash-xxxxx...` |
| AutomationEngine | `hash-xxxxx...` |
| StakingAdapter | `hash-xxxxx...` |

---

## Verify Deployment

Check any contract on testnet explorer:
- https://testnet.cspr.live/contract/<PACKAGE_HASH>

---

## Troubleshooting

### "insufficient funds"
Increase `--payment-amount` (current: 150 CSPR = 150000000000 motes)

### Deploy stuck
Wait 2-3 minutes, then check with `get-deploy`

### Wrong chain name
For testnet, use `casper-test` (not `casper`)
