import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import './Landing.css'

interface WalletState {
  isAvailable: boolean
  isConnected: boolean
  isConnecting: boolean
  publicKey: string | null
  error: string | null
  connect: () => Promise<boolean>
  disconnect: () => Promise<void>
}

interface LandingProps {
  activeAccount: {
    public_key: string
    balance?: string
  } | null
  wallet?: WalletState
}

function Landing({ activeAccount, wallet }: LandingProps) {
  const navigate = useNavigate()

  const handleConnect = async () => {
    if (activeAccount) {
      navigate('/dashboard')
    } else if (wallet) {
      if (!wallet.isAvailable) {
        window.open('https://www.casperwallet.io/', '_blank')
        return
      }
      const success = await wallet.connect()
      if (success) {
        navigate('/dashboard')
      }
    }
  }

  const features = [
    {
      icon: '🔄',
      title: 'Auto-Compound',
      description: 'Automatically reinvest your staking rewards to maximize returns',
    },
    {
      icon: '✂️',
      title: 'Split Payments',
      description: 'Distribute funds to multiple addresses with custom percentages',
    },
    {
      icon: '📅',
      title: 'Scheduled Transfers',
      description: 'Set up recurring payments that execute automatically',
    },
  ]

  return (
    <div className="landing-container">
      <div className="hero">
        <h1 className="title">Automate Your Staking Rewards</h1>
        <p className="subtitle">
          No-code automation platform that makes liquid staking rewards programmable on Casper —
          automate compounding, splitting, and scheduled transfers without writing code.
        </p>
        <p className="tagline">"Set it once, let it run forever — your staking rewards work for you automatically."</p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      {wallet?.error && (
        <div className="error-message">
          ⚠️ {wallet.error}
        </div>
      )}

      {!wallet?.isAvailable && (
        <div className="warning-message">
          Casper Wallet extension not found.{' '}
          <a href="https://www.casperwallet.io/" target="_blank" rel="noopener noreferrer">
            Install here
          </a>
        </div>
      )}

      <div className="cta-section">
        <Button
          onClick={handleConnect}
          variant="primary"
          size="large"
          disabled={wallet?.isConnecting}
        >
          {wallet?.isConnecting
            ? 'Connecting...'
            : activeAccount
              ? 'Go to Dashboard'
              : wallet?.isAvailable
                ? 'Connect Wallet'
                : 'Install Casper Wallet'
          }
        </Button>
      </div>
    </div>
  )
}

export default Landing
