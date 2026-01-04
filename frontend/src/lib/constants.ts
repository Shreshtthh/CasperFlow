// Contract addresses (Testnet)
export const CONTRACTS = {
    VAULT: 'hash-f8bcf5b8f9c3da7e0bf83303295018434fc7e5de69d4435f9930c8dc8a8c3888',
    ENGINE: 'hash-29f65ce5c908fe1dd3b7f7245334abba93b535d727182e4ed4bda3bf9056483a',
} as const

// Network configuration
export const NETWORK = {
    NAME: 'casper-test',
    RPC_URL: 'https://node.testnet.casper.network',
} as const

// Template definitions
export const TEMPLATES = [
    {
        id: 'recurring_payment',
        name: 'Recurring Payment',
        description: 'Automatically send CSPR to an address on a schedule',
        icon: '💸',
        triggerType: 0, // Time
        actionType: 0, // Transfer
    },
    {
        id: 'auto_savings',
        name: 'Auto-Savings',
        description: 'Transfer a portion of your vault to a savings address',
        icon: '🏦',
        triggerType: 0, // Time
        actionType: 0, // Transfer
    },
    {
        id: 'reward_splitter',
        name: 'Reward Splitter',
        description: 'Split incoming rewards to multiple addresses',
        icon: '✂️',
        triggerType: 0, // Time
        actionType: 1, // Split
    },
] as const

// Schedule options
export const SCHEDULES = [
    { value: 0, label: 'Daily' },
    { value: 1, label: 'Weekly' },
    { value: 2, label: 'Monthly' },
] as const

// Rule status mappings
export const RULE_STATUS = {
    0: 'Active',
    1: 'Paused',
    2: 'Deleted',
} as const

// CSPR conversion (1 CSPR = 1e9 motes)
export const CSPR_TO_MOTES = 1_000_000_000
