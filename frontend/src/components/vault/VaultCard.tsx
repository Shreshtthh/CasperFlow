import Button from '../common/Button'
import './VaultCard.css'

interface VaultCardProps {
  balance: string
  lockedAmount: string
  onDeposit: () => void
  onWithdraw: () => void
}

function VaultCard({ balance, lockedAmount, onDeposit, onWithdraw }: VaultCardProps) {
  const availableBalance = (parseFloat(balance) - parseFloat(lockedAmount)).toFixed(2)

  return (
    <div className="vault-card">
      <div className="balance-section">
        <div className="balance-label">Available Balance</div>
        <div className="balance-value">
          {availableBalance}
          <span>CSPR</span>
        </div>
      </div>

      <div className="locked-section">
        <div className="locked-label">Reserved for Rules</div>
        <div className="locked-value">
          {lockedAmount}
          <span>CSPR</span>
        </div>
      </div>

      <div className="vault-actions">
        <Button variant="primary" onClick={onDeposit}>
          Deposit
        </Button>
        <Button variant="outline" onClick={onWithdraw}>
          Withdraw
        </Button>
      </div>
    </div>
  )
}

export default VaultCard
