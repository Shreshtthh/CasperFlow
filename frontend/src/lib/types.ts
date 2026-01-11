/**
 * Type definitions for CasperFlow frontend
 */

/**
 * Rule status matching smart contract
 */
export const RuleStatus = {
    Active: 0,
    Paused: 1,
    Deleted: 2,
} as const
export type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus]

/**
 * Schedule type matching smart contract
 */
export const Schedule = {
    Daily: 0,
    Weekly: 1,
    Monthly: 2,
} as const
export type Schedule = (typeof Schedule)[keyof typeof Schedule]

/**
 * Trigger type matching smart contract
 */
export const TriggerType = {
    Time: 0,
    Condition: 1,
    Manual: 2,
} as const
export type TriggerType = (typeof TriggerType)[keyof typeof TriggerType]

/**
 * Action type matching smart contract
 */
export const ActionType = {
    Transfer: 0,
    Split: 1,
    Compound: 2,
} as const
export type ActionType = (typeof ActionType)[keyof typeof ActionType]

/**
 * Automation rule as returned from contract
 */
export interface Rule {
    id: number
    template_name: string
    owner: string
    status: RuleStatus
    trigger_type: TriggerType
    schedule: Schedule
    action_type: ActionType
    recipient: string
    amount: string
    next_execution: number
    last_executed: number | null
    created_at: number
}

/**
 * Execution history record (stored locally for MVP)
 */
export interface ExecutionRecord {
    id: string
    ruleId: number
    ruleName: string
    timestamp: number
    amount: string
    recipient: string
    success: boolean
    txHash: string
    error?: string
}

/**
 * Template definition for automation creation
 */
export interface Template {
    id: string
    name: string
    description: string
    icon: string
    triggerType: TriggerType
    actionType: ActionType
}

/**
 * Form data for creating automation rules
 */
export interface RuleFormData {
    recipient: string
    amount: string
    schedule: Schedule
}

/**
 * Wallet connection state
 */
export interface WalletState {
    isAvailable: boolean
    isConnected: boolean
    isConnecting: boolean
    publicKey: string | null
    balance: string | null
    error: string | null
}
