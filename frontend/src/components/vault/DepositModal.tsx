import { useState } from 'react'
import Button from '../common/Button'
import './DepositModal.css'

interface DepositModalProps {
    isOpen: boolean
    onClose: () => void
    onDeposit: (amount: string) => Promise<void>
    isLoading: boolean
    walletBalance?: string
}

function DepositModal({ isOpen, onClose, onDeposit, isLoading, walletBalance }: DepositModalProps) {
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async () => {
        setError('')

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }

        if (parseFloat(amount) < 2.5) {
            setError('Minimum deposit is 2.5 CSPR (to cover gas)')
            return
        }

        try {
            await onDeposit(amount)
            setAmount('')
            onClose()
        } catch (err: any) {
            setError(err.message || 'Deposit failed')
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Deposit CSPR</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        Deposit CSPR into your automation vault. These funds will be used to execute your automation rules.
                    </p>

                    <div className="form-group">
                        <label>Amount (CSPR)</label>
                        <div className="input-wrapper">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="2.5"
                                step="0.1"
                                disabled={isLoading}
                            />
                            <span className="input-suffix">CSPR</span>
                        </div>
                        {walletBalance && (
                            <p className="balance-hint">
                                Wallet balance: {walletBalance} CSPR
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="info-box">
                        <p>💡 <strong>Note:</strong> A gas fee of ~2.5 CSPR will be deducted from the deposit amount.</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Deposit'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default DepositModal
