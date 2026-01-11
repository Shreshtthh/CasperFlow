/**
 * Casper RPC Client
 * 
 * Utilities for querying contract state from Casper blockchain
 * via the public RPC endpoint.
 */

import { CLPublicKey } from 'casper-js-sdk'
import { CONTRACTS } from './constants'

// Use /rpc proxy path in development to avoid CORS issues
// In production, this should be a CORS-enabled RPC endpoint or backend proxy
const RPC_URL = '/rpc'

/**
 * Make a JSON-RPC request to the Casper node
 */
async function rpcRequest(method: string, params: Record<string, unknown>): Promise<any> {
    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
    }

    console.log('RPC Request:', method, params)

    const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    console.log('RPC Response:', method, data)

    if (data.error) {
        console.error('RPC Error:', method, data.error)
        throw new Error(data.error.message || 'RPC request failed')
    }

    return data.result
}

/**
 * Get current state root hash (needed for contract queries)
 */
async function getStateRootHash(): Promise<string> {
    const result = await rpcRequest('chain_get_state_root_hash', {})
    return result.state_root_hash
}

/**
 * Query a contract/package entity to get its named keys
 * This helps discover dictionary names that Odra generates
 */
export async function getContractNamedKeys(packageHash: string): Promise<Record<string, string>> {
    const stateRootHash = await getStateRootHash()
    const cleanHash = packageHash.replace('hash-', '')

    try {
        // Query the entity (package) to get its named keys
        const result = await rpcRequest('query_global_state', {
            state_identifier: {
                StateRootHash: stateRootHash
            },
            key: `hash-${cleanHash}`,
            path: []
        })

        console.log('Contract entity result:', result)

        // Extract named keys from the result
        const namedKeys = result?.stored_value?.AddressableEntity?.named_keys ||
            result?.stored_value?.Contract?.named_keys ||
            result?.stored_value?.Package?.versions?.[0]?.contract_hash ||
            {}

        console.log('Named keys:', namedKeys)
        return namedKeys
    } catch (error) {
        console.error('Failed to get contract named keys:', error)
        return {}
    }
}

/**
 * Query a dictionary item from a contract
 * Returns null if the dictionary or item doesn't exist (expected for empty/unused contracts)
 */
export async function queryContractDict(
    contractHash: string,
    dictName: string,
    dictItemKey: string
): Promise<any> {
    const stateRootHash = await getStateRootHash()

    // Remove 'hash-' prefix if present
    const cleanHash = contractHash.replace('hash-', '')

    try {
        const result = await rpcRequest('state_get_dictionary_item', {
            state_root_hash: stateRootHash,
            dictionary_identifier: {
                ContractNamedKey: {
                    key: `hash-${cleanHash}`,
                    dictionary_name: dictName,
                    dictionary_item_key: dictItemKey,
                },
            },
        })

        return result.stored_value?.CLValue?.parsed
    } catch {
        // Dictionary not found is expected for empty/unused contracts
        return null
    }
}

/**
 * Query an account's CSPR balance using the query_balance RPC method
 */
export async function getAccountBalance(publicKeyHex: string): Promise<string> {
    try {
        console.log('Fetching balance for:', publicKeyHex)

        const publicKey = CLPublicKey.fromHex(publicKeyHex)
        const accountHash = publicKey.toAccountHashStr()

        // Use query_balance which is simpler and more reliable
        const result = await rpcRequest('query_balance', {
            purse_identifier: {
                main_purse_under_account_hash: accountHash
            }
        })

        console.log('Balance result:', result)

        const balanceInMotes = result?.balance || '0'
        // Convert from motes to CSPR (1 CSPR = 1e9 motes)
        const balanceInCSPR = (BigInt(balanceInMotes) / BigInt(1_000_000_000)).toString()

        console.log('Balance in CSPR:', balanceInCSPR)
        return balanceInCSPR
    } catch (error) {
        console.error('Failed to get account balance:', error)

        // Fallback: try the older state_get_account_info method
        try {
            console.log('Trying fallback method...')
            const stateRootHash = await getStateRootHash()
            const publicKey = CLPublicKey.fromHex(publicKeyHex)

            const result = await rpcRequest('state_get_account_info', {
                block_identifier: null,
                public_key: publicKey.toHex()
            })

            const mainPurse = result?.account?.main_purse
            if (!mainPurse) {
                console.log('No main purse found')
                return '0'
            }

            const balanceResult = await rpcRequest('state_get_balance', {
                state_root_hash: stateRootHash,
                purse_uref: mainPurse,
            })

            const balanceInMotes = balanceResult?.balance_value || '0'
            const balanceInCSPR = (BigInt(balanceInMotes) / BigInt(1_000_000_000)).toString()

            console.log('Fallback balance:', balanceInCSPR)
            return balanceInCSPR
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError)
            return '0'
        }
    }
}

/**
 * Query vault balance for a user
 * 
 * For MVP, we use localStorage for tracking vault balances.
 * On-chain dictionary queries require Odra-specific serialization.
 */
export async function queryVaultBalance(ownerPublicKey: string): Promise<string> {
    // Use localStorage for optimistic balance tracking (MVP approach)
    const localBalanceKey = `vault_balance_${ownerPublicKey}`
    const localBalance = localStorage.getItem(localBalanceKey)
    if (localBalance) {
        return localBalance
    }
    return '0'
}

/**
 * Update local vault balance (for optimistic UI updates)
 */
export function updateLocalVaultBalance(publicKey: string, newBalance: string): void {
    const key = `vault_balance_${publicKey}`
    localStorage.setItem(key, newBalance)
}

/**
 * Get local vault balance
 */
export function getLocalVaultBalance(publicKey: string): string {
    const key = `vault_balance_${publicKey}`
    return localStorage.getItem(key) || '0'
}

/**
 * Query user's rule IDs from the automation engine
 * 
 * For MVP, returns empty array - rules are tracked in localStorage
 */
export async function queryUserRuleIds(_ownerPublicKey: string): Promise<number[]> {
    // MVP: Rules are tracked locally, on-chain query not functional due to Odra naming
    return []
}

/**
 * Query a single rule by ID
 * 
 * For MVP, returns null - rules are tracked in localStorage
 */
export async function queryRule(_ruleId: number): Promise<any | null> {
    // MVP: Rules are tracked locally, on-chain query not functional due to Odra naming
    return null
}

/**
 * Query all rules for a user
 * 
 * For MVP, returns empty array - rules are tracked in localStorage
 */
export async function queryUserRules(_ownerPublicKey: string): Promise<any[]> {
    // MVP: Rules are tracked locally, on-chain query not functional due to Odra naming
    return []
}

/**
 * Get deploy status by deploy hash
 */
export async function getDeployStatus(deployHash: string): Promise<'pending' | 'success' | 'failed'> {
    try {
        const result = await rpcRequest('info_get_deploy', {
            deploy_hash: deployHash,
        })

        const executionResults = result?.execution_results
        if (!executionResults || executionResults.length === 0) {
            return 'pending'
        }

        const lastResult = executionResults[executionResults.length - 1]
        if (lastResult.result?.Success) {
            return 'success'
        } else if (lastResult.result?.Failure) {
            return 'failed'
        }

        return 'pending'
    } catch (error) {
        console.error('Failed to get deploy status:', error)
        return 'pending'
    }
}
