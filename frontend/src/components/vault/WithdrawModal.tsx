import { useState } from 'react'
import Button from '../common/Button'
import './DepositModal.css' // Reuse same styles

interface WithdrawModalProps {
    isOpen: boolean
    onClose: () => void
    onWithdraw: (amount: string) => Promise<void>
    isLoading: boolean
    vaultBalance: string
}

function WithdrawModal({ isOpen, onClose, onWithdraw, isLoading, vaultBalance }: WithdrawModalProps) {
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async () => {
        setError('')

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }

        if (parseFloat(amount) > parseFloat(vaultBalance)) {
            setError('Insufficient vault balance')
            return
        }

        try {
            await onWithdraw(amount)
            setAmount('')
            onClose()
        } catch (err: any) {
            setError(err.message || 'Withdraw failed')
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleMax = () => {
        setAmount(vaultBalance)
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Withdraw CSPR</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        Withdraw CSPR from your automation vault back to your wallet.
                    </p>

                    <div className="form-group">
                        <label>Amount (CSPR)</label>
                        <div className="input-wrapper">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="0.1"
                                step="0.1"
                                max={vaultBalance}
                                disabled={isLoading}
                            />
                            <button className="max-btn" onClick={handleMax} disabled={isLoading}>
                                MAX
                            </button>
                        </div>
                        <p className="balance-hint">
                            Available: <strong>{vaultBalance} CSPR</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="info-box">
                        <p>💡 <strong>Note:</strong> A gas fee of ~2.5 CSPR will be deducted from your withdrawal.</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Withdraw'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default WithdrawModal
