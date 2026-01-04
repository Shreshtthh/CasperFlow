import {
    DeployUtil,
    RuntimeArgs,
    CLValueBuilder,
    CLPublicKey,
    Contracts
} from 'casper-js-sdk'
import { CONTRACTS, CSPR_TO_MOTES } from './constants'

const NETWORK_NAME = 'casper-test'
const VAULT_CONTRACT_HASH = CONTRACTS.VAULT.replace('hash-', '')

/**
 * Create a deploy for depositing CSPR into the vault
 */
export function createDepositDeploy(
    senderPublicKey: string,
    amountInCSPR: string
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)
    const amountInMotes = Math.floor(parseFloat(amountInCSPR) * CSPR_TO_MOTES)

    // Create deploy parameters
    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000 // 30 min TTL
    )

    // Create session - simple transfer for demo
    const session = DeployUtil.ExecutableDeployItem.newTransfer(
        amountInMotes,
        publicKey, // Transfer to self for vault deposit simulation
        null,
        Date.now() // Use timestamp as transfer ID
    )

    // Payment
    const payment = DeployUtil.standardPayment(2500000000) // 2.5 CSPR gas

    // Create the deploy
    const deploy = DeployUtil.makeDeploy(deployParams, session, payment)

    return deploy
}

/**
 * Create a deploy for withdrawing CSPR from the vault
 */
export function createWithdrawDeploy(
    senderPublicKey: string,
    amountInCSPR: string
): DeployUtil.Deploy {
    const publicKey = CLPublicKey.fromHex(senderPublicKey)
    const amountInMotes = Math.floor(parseFloat(amountInCSPR) * CSPR_TO_MOTES)

    const deployParams = new DeployUtil.DeployParams(
        publicKey,
        NETWORK_NAME,
        1,
        1800000
    )

    // For demo, create a simple transfer
    const session = DeployUtil.ExecutableDeployItem.newTransfer(
        amountInMotes,
        publicKey,
        null,
        Date.now()
    )

    const payment = DeployUtil.standardPayment(2500000000)

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
        const signature = await provider.sign(
            JSON.stringify(deployJson),
            senderPublicKey
        )

        if (signature.cancelled) {
            throw new Error('Transaction cancelled by user')
        }

        console.log('Deploy signed:', signature)

        // In production, send the signed deploy to the network
        // For demo, return the deploy hash
        const deployHash = Buffer.from(deploy.hash).toString('hex')

        return { deployHash }
    } catch (error: any) {
        console.error('Error signing deploy:', error)
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
