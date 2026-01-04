# 🌊 CasperFlow

> **No-Code Automation Platform for Casper Staking Rewards**

[![Casper Hackathon 2026](https://img.shields.io/badge/Casper%20Hackathon-2026-red?style=for-the-badge)](https://casper.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Testnet](https://img.shields.io/badge/Network-Testnet-green?style=for-the-badge)](https://testnet.cspr.live)

**CasperFlow** is a no-code automation platform that makes liquid staking rewards programmable on Casper. Users can automate compounding, splitting, and scheduled transfers without writing code — "Set it once, let it run forever."

Built for the **Casper Hackathon 2026** | Targeting: **Main Track** + **Liquid Staking Track**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Deployed Contracts](#-deployed-contracts)
- [Quick Start](#-quick-start)
- [Usage Examples](#-usage-examples)
- [Testing](#-testing)
- [Tech Stack](#-tech-stack)
- [Design Philosophy](#-design-philosophy)
- [Roadmap](#-roadmap)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Overview

### The Problem

Casper stakers face a manual, time-consuming process to manage their rewards:
- **No automation** — Users must manually claim and reinvest rewards
- **Missed opportunities** — Irregular compounding reduces APY by 15-30%
- **Complex DeFi** — Splitting rewards across strategies requires technical knowledge
- **No scheduled payments** — Recurring transfers require manual execution

### The Solution

CasperFlow provides a **visual, no-code interface** for creating automation rules that execute on-chain:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Wallet   │────▶│ Automation Vault │────▶│  Target Action  │
│  (Casper Wallet)│     │   (Smart Contract)│     │ (Transfer/Stake)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         │   Deposit CSPR        │   Execute Rules        │
         │───────────────────────│────────────────────────│
```

Users deposit CSPR into their personal vault, create automation rules using templates, and the system executes them based on triggers (time-based or event-based).

---

## ✨ Key Features

### 🔄 Automated Compounding
Automatically reinvest staking rewards at optimal intervals to maximize APY.

### ✂️ Reward Splitting
Split incoming rewards across multiple addresses with custom percentages (e.g., 70% reinvest, 30% to cold wallet).

### 📅 Scheduled Transfers
Set up recurring payments that execute automatically — daily, weekly, or monthly.

### 🏦 Personal Vault
Each user has a dedicated smart contract vault for managing funds with full custody.

### 📊 Visual Dashboard
Real-time overview of vault balance, active rules, and execution history.

### 🔐 Non-Custodial
Users maintain full control — only authorized transactions can move funds.

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                    │
├────────────────────────────────────────────────────────────────────┤
│  Landing Page  │  Dashboard  │  Create Rule  │  History           │
│                │             │               │                     │
│  • Hero CTA    │  • Vault    │  • Templates  │  • Timeline         │
│  • Features    │  • Rules    │  • Form       │  • Tx Links         │
│  • Connect     │  • Actions  │  • Preview    │  • Filters          │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                    CASPER WALLET INTEGRATION                       │
│               (Native window.CasperWalletProvider)                 │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                     SMART CONTRACTS (Odra v2.4.0)                  │
├─────────────────────┬─────────────────────┬────────────────────────┤
│  AutomationVault    │  AutomationEngine   │  StakingAdapter        │
│  ────────────────── │  ────────────────── │  ──────────────────    │
│  • deposit_cspr()   │  • create_rule()    │  • delegate()          │
│  • withdraw_cspr()  │  • pause_rule()     │  • undelegate()        │
│  • execute()        │  • delete_rule()    │  • claim_rewards()     │
│  • get_balance()    │  • execute_rule()   │  • get_staked()        │
└─────────────────────┴─────────────────────┴────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                      CASPER TESTNET                                │
│                 https://testnet.cspr.live                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contracts

### AutomationVault
Personal vault for each user to deposit and manage CSPR.

| Function | Description |
|----------|-------------|
| `deposit_cspr()` | Deposit CSPR into the vault (payable) |
| `withdraw_cspr(amount)` | Withdraw CSPR to user's wallet |
| `execute_transfer(to, amount)` | Execute authorized transfer |
| `set_automation_engine(addr)` | Link vault to engine contract |
| `get_balance()` | Get current vault balance |

### AutomationEngine
Central contract for managing automation rules.

| Function | Description |
|----------|-------------|
| `create_rule(vault, trigger_type, action_type, params)` | Create new automation rule |
| `pause_rule(rule_id)` | Pause an active rule |
| `resume_rule(rule_id)` | Resume a paused rule |
| `delete_rule(rule_id)` | Permanently delete a rule |
| `execute_rule(rule_id)` | Execute a ready rule |
| `get_rules(owner)` | Get all rules for an owner |

### StakingAdapter
Interface for native Casper staking operations.

| Function | Description |
|----------|-------------|
| `delegate(validator, amount)` | Stake CSPR with validator |
| `undelegate(validator, amount)` | Unstake CSPR |
| `redelegate(from, to, amount)` | Move stake between validators |

---

## 🚀 Deployed Contracts

### Casper Testnet

| Contract | Hash |
|----------|------|
| **AutomationVault** | `hash-f8bcf5b8f9c3da7e0bf83303295018434fc7e5de69d4435f9930c8dc8a8c3888` |
| **AutomationEngine** | `hash-29f65ce5c908fe1dd3b7f7245334abba93b535d727182e4ed4bda3bf9056483a` |

View on Explorer:
- [Vault Contract](https://testnet.cspr.live/contract-package/f8bcf5b8f9c3da7e0bf83303295018434fc7e5de69d4435f9930c8dc8a8c3888)
- [Engine Contract](https://testnet.cspr.live/contract-package/29f65ce5c908fe1dd3b7f7245334abba93b535d727182e4ed4bda3bf9056483a)

---

## ⚡ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (for contracts)
- [Casper Wallet Extension](https://www.casperwallet.io/)
- Testnet CSPR (from [faucet](https://testnet.cspr.live/tools/faucet))

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/casperflow.git
cd casperflow

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Smart Contract Development

```bash
# Navigate to contracts
cd casperflow-contracts

# Build contracts
cargo odra build

# Run tests
cargo odra test

# Deploy to testnet (requires .env configuration)
cargo run --bin deploy --features livenet
```

### Environment Setup (Contracts)

Create `.env` in `casperflow-contracts/`:

```env
ODRA_CASPER_LIVENET_SECRET_KEY_PATH=./keys/secret_key.pem
ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network
ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test
```

---

## 💡 Usage Examples

### 1. Connect Wallet & Deposit

1. Click **"Connect Wallet"** on the landing page
2. Approve connection in Casper Wallet
3. Navigate to **Dashboard**
4. Click **"Deposit"** → Enter amount → Sign transaction

### 2. Create a Recurring Payment Rule

1. Go to **Create Automation**
2. Select **"Recurring Payment"** template
3. Enter recipient address and amount
4. Choose schedule (Daily/Weekly/Monthly)
5. Click **"Create Rule"** → Sign transaction

### 3. Monitor & Manage Rules

- **Dashboard**: View all active rules with status badges
- **Pause/Resume**: Toggle rule execution
- **Delete**: Remove rules permanently
- **History**: Track all past executions with tx links

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd casperflow-contracts

# Run all unit tests (OdraVM)
cargo odra test

# Run specific test
cargo test test_deposit_and_withdraw
```

### Frontend Tests

```bash
cd frontend

# Type checking
npm run build

# Lint
npm run lint
```

### Manual E2E Testing

1. Connect wallet with testnet CSPR
2. Deposit → Verify balance updates
3. Create rule → Check rule appears in dashboard
4. Pause/Resume → Verify status changes
5. Withdraw → Confirm funds return to wallet

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router** | Client-side routing |
| **CSS Variables** | Theming & styling |
| **casper-js-sdk** | Transaction creation |

### Smart Contracts
| Technology | Purpose |
|------------|---------|
| **Rust** | Contract language |
| **Odra Framework v2.4.0** | Smart contract development |
| **WebAssembly (WASM)** | Contract execution |
| **Casper VM** | Blockchain runtime |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Casper Testnet** | Blockchain network |
| **Casper Wallet** | User authentication & signing |
| **CSPR.live** | Block explorer |

---

## 🎨 Design Philosophy

### 1. **No-Code First**
Every automation that can be built with code should be achievable through our visual interface. Templates abstract complexity.

### 2. **Non-Custodial by Default**
Users always maintain control of their funds. Smart contracts enforce authorization, not trust.

### 3. **Transparency**
All rules and executions are verifiable on-chain. No hidden logic or off-chain dependencies.

### 4. **Progressive Disclosure**
Start simple with templates, unlock advanced options for power users.

### 5. **Dark Mode Native**
Designed for crypto-native users who prefer dark interfaces. Clean, minimal, functional.

---

## 🗺 Roadmap

### Phase 1: MVP ✅
- [x] Vault deposit/withdraw
- [x] Rule templates (3 types)
- [x] Dashboard with rule management
- [x] Wallet integration

### Phase 2: Enhanced (Post-Hackathon)
- [ ] Auto-compound staking integration
- [ ] Multi-sig vault support
- [ ] Advanced scheduling (cron expressions)
- [ ] Gas optimization

### Phase 3: Ecosystem
- [ ] Validator partnerships
- [ ] Mobile app (React Native)
- [ ] API for integrations
- [ ] Mainnet deployment

---

## 👥 Team
Shreshth Sharma
Built with ❤️ for the **Casper Hackathon 2026**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Testnet Explorer**: [testnet.cspr.live](https://testnet.cspr.live)
- **Casper Wallet**: [casperwallet.io](https://www.casperwallet.io/)
- **Odra Framework**: [odra.dev](https://odra.dev)

---

<p align="center">
  <b>CasperFlow</b> — Automate your staking rewards, maximize your returns.
</p>
