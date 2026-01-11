import { Link, useLocation } from 'react-router-dom'
import './Header.css'

interface WalletState {
  isAvailable: boolean
  isConnected: boolean
  isConnecting: boolean
  publicKey: string | null
  balance: string | null
  error: string | null
  connect: () => Promise<boolean>
  disconnect: () => Promise<void>
}

interface HeaderProps {
  activeAccount: {
    public_key: string
    balance?: string
  } | null
  wallet?: WalletState
}

function Header({ activeAccount, wallet }: HeaderProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const handleConnectClick = async () => {
    if (wallet?.isConnected) {
      await wallet.disconnect()
    } else {
      await wallet?.connect()
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          🌊 Casper<span>Flow</span>
        </Link>

        {activeAccount && (
          <nav className="nav">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/create"
              className={`nav-link ${isActive('/create') ? 'active' : ''}`}
            >
              Create Automation
            </Link>
            <Link
              to="/history"
              className={`nav-link ${isActive('/history') ? 'active' : ''}`}
            >
              History
            </Link>
          </nav>
        )}

        <div className="account-info">
          <span className="badge">Testnet</span>

          {wallet?.isConnected && wallet.balance && (
            <span className="balance-display">
              {wallet.balance} CSPR
            </span>
          )}

          {wallet && (
            <button
              className={`wallet-btn ${wallet.isConnected ? 'connected' : ''}`}
              onClick={handleConnectClick}
              disabled={wallet.isConnecting}
            >
              {wallet.isConnecting
                ? 'Connecting...'
                : wallet.isConnected && wallet.publicKey
                  ? formatAddress(wallet.publicKey)
                  : wallet.isAvailable
                    ? 'Connect Wallet'
                    : 'Install Wallet'
              }
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

