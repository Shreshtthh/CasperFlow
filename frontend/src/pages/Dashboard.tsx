import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import VaultCard from '../components/vault/VaultCard'
import DepositModal from '../components/vault/DepositModal'
import WithdrawModal from '../components/vault/WithdrawModal'
import RuleCard from '../components/automation/RuleCard'
import Button from '../components/common/Button'
import { useToast } from '../components/common/Toast'
import {
    createDepositDeploy,
    createWithdrawDeploy,
    createPauseRuleDeploy,
    createResumeRuleDeploy,
    createDeleteRuleDeploy,
    signAndSendDeploy
} from '../lib/contractService'
import { queryVaultBalance, queryUserRules, updateLocalVaultBalance } from '../lib/casperRpc'
import { RuleStatus } from '../lib/types'
import './Dashboard.css'

interface DashboardProps {
    activeAccount: {
        public_key: string
        balance?: string
    } | null
}

interface DisplayRule {
    id: number
    template_name: string
    status: number
    next_execution: number
    amount: string
    recipient: string
}

function Dashboard({ activeAccount }: DashboardProps) {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [vaultBalance, setVaultBalance] = useState<string | null>(null)
    const [rules, setRules] = useState<DisplayRule[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [isDepositing, setIsDepositing] = useState(false)
    const [isWithdrawing, setIsWithdrawing] = useState(false)

    // Fetch data from chain
    const fetchData = useCallback(async () => {
        if (!activeAccount?.public_key) return

        setIsLoading(true)
        try {
            // Fetch vault balance
            const balance = await queryVaultBalance(activeAccount.public_key)
            setVaultBalance(balance)

            // Fetch user rules
            const userRules = await queryUserRules(activeAccount.public_key)
            const displayRules: DisplayRule[] = userRules.map((rule: any) => ({
                id: rule.id,
                template_name: rule.template_name || 'Automation Rule',
                status: rule.status ?? RuleStatus.Active,
                next_execution: rule.next_execution || 0,
                amount: rule.amount ? (BigInt(rule.amount) / BigInt(1_000_000_000)).toString() : '0',
                recipient: rule.recipient ? `${rule.recipient.slice(0, 8)}...${rule.recipient.slice(-4)}` : 'N/A',
            }))
            setRules(displayRules)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            showToast('error', 'Failed to load data from chain')
        } finally {
            setIsLoading(false)
        }
    }, [activeAccount?.public_key, showToast])

    useEffect(() => {
        if (!activeAccount) {
            navigate('/')
        } else {
            fetchData()
        }
    }, [activeAccount, navigate, fetchData])

    const handleDeposit = async (amount: string) => {
        if (!activeAccount?.public_key) {
            throw new Error('Wallet not connected')
        }

        setIsDepositing(true)
        try {
            const deploy = createDepositDeploy(activeAccount.public_key, amount)
            const result = await signAndSendDeploy(deploy, activeAccount.public_key)

            if (result?.deployHash) {
                showToast('success', `Deposit submitted! TX: ${result.deployHash.slice(0, 8)}...`, result.deployHash)
                // Optimistic update - save to localStorage for persistence
                const currentBalance = parseFloat(vaultBalance || '0')
                const newBalance = (currentBalance + parseFloat(amount)).toFixed(2)
                setVaultBalance(newBalance)
                updateLocalVaultBalance(activeAccount.public_key, newBalance)
            }
        } catch (error: any) {
            if (error.message?.includes('cancelled')) {
                showToast('warning', 'Transaction cancelled by user')
            } else {
                showToast('error', error.message || 'Deposit failed')
            }
            throw error
        } finally {
            setIsDepositing(false)
        }
    }

    const handleWithdraw = async (amount: string) => {
        if (!activeAccount?.public_key) {
            throw new Error('Wallet not connected')
        }

        setIsWithdrawing(true)
        try {
            const deploy = createWithdrawDeploy(activeAccount.public_key, amount)
            const result = await signAndSendDeploy(deploy, activeAccount.public_key)

            if (result?.deployHash) {
                showToast('success', `Withdrawal submitted! TX: ${result.deployHash.slice(0, 8)}...`, result.deployHash)
                // Optimistic update - save to localStorage for persistence
                const currentBalance = parseFloat(vaultBalance || '0')
                const newBalance = Math.max(0, currentBalance - parseFloat(amount)).toFixed(2)
                setVaultBalance(newBalance)
                updateLocalVaultBalance(activeAccount.public_key, newBalance)
            }
        } catch (error: any) {
            if (error.message?.includes('cancelled')) {
                showToast('warning', 'Transaction cancelled by user')
            } else {
                showToast('error', error.message || 'Withdraw failed')
            }
            throw error
        } finally {
            setIsWithdrawing(false)
        }
    }

    const handlePauseRule = async (ruleId: number) => {
        if (!activeAccount?.public_key) return

        const rule = rules.find(r => r.id === ruleId)
        if (!rule) return

        const isPaused = rule.status === RuleStatus.Paused

        try {
            const deploy = isPaused
                ? createResumeRuleDeploy(activeAccount.public_key, ruleId)
                : createPauseRuleDeploy(activeAccount.public_key, ruleId)

            const result = await signAndSendDeploy(deploy, activeAccount.public_key)

            if (result?.deployHash) {
                // Optimistic update
                const newStatus = isPaused ? RuleStatus.Active : RuleStatus.Paused
                setRules(rules.map(r =>
                    r.id === ruleId ? { ...r, status: newStatus } : r
                ))
                showToast('success', `Rule ${isPaused ? 'resumed' : 'paused'}! TX: ${result.deployHash.slice(0, 8)}...`)
            }
        } catch (error: any) {
            if (!error.message?.includes('cancelled')) {
                showToast('error', error.message || 'Failed to update rule')
            }
        }
    }

    const handleDeleteRule = async (ruleId: number) => {
        if (!activeAccount?.public_key) return

        try {
            const deploy = createDeleteRuleDeploy(activeAccount.public_key, ruleId)
            const result = await signAndSendDeploy(deploy, activeAccount.public_key)

            if (result?.deployHash) {
                // Optimistic update
                setRules(rules.filter(r => r.id !== ruleId))
                showToast('success', `Rule deleted! TX: ${result.deployHash.slice(0, 8)}...`)
            }
        } catch (error: any) {
            if (!error.message?.includes('cancelled')) {
                showToast('error', error.message || 'Failed to delete rule')
            }
        }
    }

    if (!activeAccount) {
        return null
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Manage your vault and automation rules</p>

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Your Vault</h2>
                    {isLoading && <span className="loading-indicator">Loading...</span>}
                </div>
                <VaultCard
                    balance={vaultBalance ?? '0'}
                    lockedAmount="0"
                    onDeposit={() => setShowDepositModal(true)}
                    onWithdraw={() => setShowWithdrawModal(true)}
                />
            </section>

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Active Rules</h2>
                    <Button variant="primary" onClick={() => navigate('/create')}>
                        + New Rule
                    </Button>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <p>Loading rules from chain...</p>
                    </div>
                ) : rules.length > 0 ? (
                    <div className="rules-grid">
                        {rules.map(rule => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                onPause={() => handlePauseRule(rule.id)}
                                onDelete={() => handleDeleteRule(rule.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p className="empty-text">
                            You don't have any automation rules yet.<br />
                            Create your first rule to get started!
                        </p>
                        <Button variant="primary" onClick={() => navigate('/create')}>
                            Create Your First Rule
                        </Button>
                    </div>
                )}
            </section>

            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                onDeposit={handleDeposit}
                isLoading={isDepositing}
            />

            <WithdrawModal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                onWithdraw={handleWithdraw}
                isLoading={isWithdrawing}
                vaultBalance={vaultBalance ?? '0'}
            />
        </div>
    )
}

export default Dashboard
