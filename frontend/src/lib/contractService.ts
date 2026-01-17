/**
 * Contract Service
 * 
 * Creates deploys for interacting with CasperAutomations smart contracts.
 * These deploys are signed by the user's wallet and submitted to the network.
 */

import {
    DeployUtil,
    CLPublicKey,
    CLValueBuilder,
    RuntimeArgs,
} from 'casper-js-sdk'
import { CONTRACTS, NETWORK, CSPR_TO_MOTES } from './constants'

const NETWORK_NAME = NETWORK.NAME

// Remove 'hash-' prefix for contract calls
const VAULT_HASH = CONTRACTS.VAULT.replace('hash-', '')
const ENGINE_HASH = CONTRACTS.ENGINE.replace('hash-', '')

/**
 * Create a deploy for depositing CSPR into the vault
 */
export function createDepositDeploy(
    senderPublicKey: string,
    amountInCSPR: string
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)
    const amountInMotes = BigInt(Math.floor(parseFloat(amountInCSPR) * CSPR_TO_MOTES))

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000 // 30 min TTL
    )

    // Call vault.deposit() - payable function
    const args = RuntimeArgs.fromMap({})

    // Use newStoredVersionContractByHash for package hash (null version = latest)
    const session = DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        Uint8Array.from(Buffer.from(VAULT_HASH, 'hex')),
        null, // null = use latest version
        'deposit',
        args
    )

    // Payment includes the deposit amount + gas
    const payment = DeployUtil.standardPayment(amountInMotes + BigInt(2_500_000_000))

    return DeployUtil.makeDeploy(deployParams, session, payment)
}

/**
 * Create a deploy for withdrawing CSPR from the vault
 */
export function createWithdrawDeploy(
    senderPublicKey: string,
    amountInCSPR: string
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)
    const amountInMotes = BigInt(Math.floor(parseFloat(amountInCSPR) * CSPR_TO_MOTES))

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000
    )

    // Call vault.withdraw(amount)
    const args = RuntimeArgs.fromMap({
        amount: CLValueBuilder.u512(amountInMotes.toString()),
    })

    // Use newStoredVersionContractByHash for package hash (null version = latest)
    const session = DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        Uint8Array.from(Buffer.from(VAULT_HASH, 'hex')),
        null,
        'withdraw',
        args
    )

    const payment = DeployUtil.standardPayment(2_500_000_000) // 2.5 CSPR gas

    return DeployUtil.makeDeploy(deployParams, session, payment)
}

/**
 * Create a deploy for creating an automation rule
 */
export function createRuleDeploy(
    senderPublicKey: string,
    templateName: string,
    triggerType: number,
    schedule: number,
    actionType: number,
    recipient: string,
    amountInCSPR: string
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)
    const amountInMotes = BigInt(Math.floor(parseFloat(amountInCSPR) * CSPR_TO_MOTES))

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000
    )

    // Parse recipient as a public key and convert to account hash byte array
    let recipientBytes: Uint8Array
    try {
        const recipientKey = CLPublicKey.fromHex(recipient)
        recipientBytes = recipientKey.toAccountHash()
    } catch {
        // If parsing fails, assume it's already an account hash
        recipientBytes = Uint8Array.from(Buffer.from(recipient.replace('account-hash-', ''), 'hex'))
    }

    // Call engine.create_rule(template_name, trigger_type, schedule, action_type, recipient, amount)
    const args = RuntimeArgs.fromMap({
        template_name: CLValueBuilder.string(templateName),
        trigger_type: CLValueBuilder.u8(triggerType),
        schedule: CLValueBuilder.u8(schedule),
        action_type: CLValueBuilder.u8(actionType),
        recipient: CLValueBuilder.byteArray(recipientBytes),
        amount: CLValueBuilder.u512(amountInMotes.toString()),
    })

    const session = DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        Uint8Array.from(Buffer.from(ENGINE_HASH, 'hex')),
        null,
        'create_rule',
        args
    )

    const payment = DeployUtil.standardPayment(5_000_000_000) // 5 CSPR gas for rule creation

    return DeployUtil.makeDeploy(deployParams, session, payment)
}

/**
 * Create a deploy for pausing a rule
 */
export function createPauseRuleDeploy(
    senderPublicKey: string,
    ruleId: number
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000
    )

    const args = RuntimeArgs.fromMap({
        rule_id: CLValueBuilder.u64(ruleId),
    })

    const session = DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        Uint8Array.from(Buffer.from(ENGINE_HASH, 'hex')),
        null,
        'pause_rule',
        args
    )

    const payment = DeployUtil.standardPayment(2_500_000_000)

    return DeployUtil.makeDeploy(deployParams, session, payment)
}

/**
 * Create a deploy for resuming a paused rule
 */
export function createResumeRuleDeploy(
    senderPublicKey: string,
    ruleId: number
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000
    )

    const args = RuntimeArgs.fromMap({
        rule_id: CLValueBuilder.u64(ruleId),
    })

    const session = DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        Uint8Array.from(Buffer.from(ENGINE_HASH, 'hex')),
        null,
        'resume_rule',
        args
    )

    const payment = DeployUtil.standardPayment(2_500_000_000)

    return DeployUtil.makeDeploy(deployParams, session, payment)
}

/**
 * Create a deploy for deleting a rule
 */
export function createDeleteRuleDeploy(
    senderPublicKey: string,
    ruleId: number
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000
    )

    const args = RuntimeArgs.fromMap({
        rule_id: CLValueBuilder.u64(ruleId),
    })

    const session = DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        Uint8Array.from(Buffer.from(ENGINE_HASH, 'hex')),
        null,
        'delete_rule',
        args
    )

    const payment = DeployUtil.standardPayment(2_500_000_000)

    return DeployUtil.makeDeploy(deployParams, session, payment)
}

/**
 * Sign and send a deploy using the Casper Wallet
 */
export async function signAndSendDeploy(
    deploy: DeployUtil.Deploy,
    senderPublicKey: string
): Promise<{ deployHash: string } | null> {
    if (typeof window === 'undefined') return null

    const CasperWalletProvider = (window as any).CasperWalletProvider
    if (!CasperWalletProvider) {
        throw new Error('Casper Wallet not found')
    }

    const provider = CasperWalletProvider({ timeout: 30 * 60 * 1000 })

    try {
        // Convert deploy to JSON for the wallet
        const deployJson = DeployUtil.deployToJson(deploy)

        console.log('Signing deploy:', deployJson)

        // Sign the deploy
        const signResult = await provider.sign(
            JSON.stringify(deployJson),
            senderPublicKey
        )

        if (signResult.cancelled) {
            throw new Error('Transaction cancelled by user')
        }

        console.log('Deploy signed:', signResult)

        // The wallet returns just the signature - we need to manually attach it
        // signResult has: { cancelled: false, signatureHex: string, signature: Uint8Array }
        const signatureHex = signResult.signatureHex

        // Create the signed deploy by adding the approval
        const publicKey = CLPublicKey.fromHex(senderPublicKey)

        // Determine signature prefix based on key algorithm
        // Ed25519 keys (start with 01) use 01 prefix, Secp256k1 keys (start with 02) use 02 prefix
        const keyAlgorithmPrefix = senderPublicKey.slice(0, 2)
        const signaturePrefix = keyAlgorithmPrefix // '01' for Ed25519, '02' for Secp256k1

        // Build the full signature with algorithm prefix if not already present
        const fullSignature = signatureHex.startsWith('01') || signatureHex.startsWith('02')
            ? signatureHex
            : `${signaturePrefix}${signatureHex}`

        // Build the approval structure for the deploy JSON
        const deployData = deployJson.deploy as Record<string, unknown>
        const deployJsonWithApproval = {
            ...deployData,
            approvals: [
                {
                    signer: publicKey.toHex(),
                    signature: fullSignature
                }
            ]
        }

        console.log('Submitting deploy to network...', deployJsonWithApproval)

        // Submit the signed deploy to the network via RPC
        const response = await fetch('/rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'account_put_deploy',
                params: {
                    deploy: deployJsonWithApproval
                }
            })
        })

        const result = await response.json()
        console.log('Deploy submission result:', result)

        if (result.error) {
            console.error('Deploy submission error details:', JSON.stringify(result.error, null, 2))
            throw new Error(result.error.data || result.error.message || 'Failed to submit deploy')
        }

        const deployHash = result.result?.deploy_hash || Buffer.from(deploy.hash).toString('hex')

        return { deployHash }
    } catch (error: any) {
        console.error('Error signing/sending deploy:', error)
        throw error
    }
}

/**
 * Format a public key for display
 */
export function formatPublicKey(publicKey: string): string {
    if (publicKey.length <= 16) return publicKey
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-6)}`
}
