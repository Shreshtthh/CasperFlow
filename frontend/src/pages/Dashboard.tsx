import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VaultCard from '../components/vault/VaultCard'
import DepositModal from '../components/vault/DepositModal'
import WithdrawModal from '../components/vault/WithdrawModal'
import RuleCard from '../components/automation/RuleCard'
import Button from '../components/common/Button'
import { useToast } from '../components/common/Toast'
import { createDepositDeploy, createWithdrawDeploy, signAndSendDeploy } from '../lib/contractService'
import { CSPR_TO_MOTES } from '../lib/constants'
import './Dashboard.css'

interface WalletState {
    isAvailable: boolean
    isConnected: boolean
    isConnecting: boolean
    publicKey: string | null
    error: string | null
    connect: () => Promise<boolean>
    disconnect: () => Promise<void>
}

interface DashboardProps {
    activeAccount: {
        public_key: string
        balance?: string
    } | null
    wallet?: WalletState
}

// Mock data for demo
const mockRules = [
    {
        id: 1,
        template_name: 'Recurring Payment',
        status: 0,
        next_execution: Date.now() + 86400000,
        amount: '100',
        recipient: '0123...abcd',
    },
    {
        id: 2,
        template_name: 'Auto-Savings',
        status: 1,
        next_execution: 0,
        amount: '50',
        recipient: '9876...wxyz',
    },
]

function Dashboard({ activeAccount, wallet }: DashboardProps) {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [vaultBalance, setVaultBalance] = useState('100') // Demo balance
    const [rules, setRules] = useState(mockRules)
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [isDepositing, setIsDepositing] = useState(false)
    const [isWithdrawing, setIsWithdrawing] = useState(false)

    useEffect(() => {
        if (!activeAccount) {
            navigate('/')
        }
    }, [activeAccount, navigate])

    const handleDeposit = async (amount: string) => {
        if (!activeAccount?.public_key) {
            throw new Error('Wallet not connected')
        }

        setIsDepositing(true)
        try {
            const deploy = createDepositDeploy(activeAccount.public_key, amount)
            const result = await signAndSendDeploy(deploy, activeAccount.public_key)

            if (result?.deployHash) {
                const newBalance = (parseFloat(vaultBalance) + parseFloat(amount)).toFixed(2)
                setVaultBalance(newBalance)
                showToast('success', `Deposited ${amount} CSPR successfully!`, result.deployHash)
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
                const newBalance = (parseFloat(vaultBalance) - parseFloat(amount)).toFixed(2)
                setVaultBalance(newBalance)
                showToast('success', `Withdrew ${amount} CSPR successfully!`, result.deployHash)
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
        const rule = rules.find(r => r.id === ruleId)
        const newStatus = rule?.status === 0 ? 1 : 0
        setRules(rules.map(r =>
            r.id === ruleId ? { ...r, status: newStatus } : r
        ))
        showToast('success', `Rule ${newStatus === 0 ? 'resumed' : 'paused'} successfully`)
    }

    const handleDeleteRule = async (ruleId: number) => {
        setRules(rules.filter(r => r.id !== ruleId))
        showToast('success', 'Rule deleted successfully')
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
                </div>
                <VaultCard
                    balance={vaultBalance}
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

                {rules.length > 0 ? (
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
                vaultBalance={vaultBalance}
            />
        </div>
    )
}

export default Dashboard
