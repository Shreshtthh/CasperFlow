import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './History.css'

interface HistoryProps {
  activeAccount: {
    public_key: string
    balance?: string
  } | null
}

interface HistoryItem {
  id: string
  ruleName: string
  timestamp: number
  amount: string
  recipient: string
  success: boolean
  txHash: string
  error?: string
}

function History({ activeAccount }: HistoryProps) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!activeAccount) {
      navigate('/')
      return
    }

    // Load history from localStorage
    const historyKey = `history_${activeAccount.public_key}`
    const stored = localStorage.getItem(historyKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setHistory(parsed)
      } catch (e) {
        console.error('Failed to parse history:', e)
      }
    }
    setIsLoading(false)
  }, [activeAccount, navigate])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const clearHistory = () => {
    if (activeAccount?.public_key) {
      const historyKey = `history_${activeAccount.public_key}`
      localStorage.removeItem(historyKey)
      setHistory([])
    }
  }

  if (!activeAccount) {
    return null
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h1 className="page-title">Execution History</h1>
          <p className="page-subtitle">Track all your automation rule executions</p>
        </div>
        {history.length > 0 && (
          <button className="clear-btn" onClick={clearHistory}>
            Clear History
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="loading-state">
          <p>Loading history...</p>
        </div>
      ) : history.length > 0 ? (
        <div className="timeline">
          {history.map((item) => (
            <div className="history-item" key={item.id}>
              <div className="item-header">
                <h3 className="item-title">{item.ruleName}</h3>
                <span className={`status-badge ${item.success ? 'status-success' : 'status-failed'}`}>
                  {item.success ? 'Success' : 'Failed'}
                </span>
              </div>

              <div className="item-details">
                <div className="detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{formatDate(item.timestamp)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value">{item.amount} CSPR</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Recipient</span>
                  <span className="detail-value">{item.recipient}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Transaction</span>
                  <a
                    href={`https://testnet.cspr.live/deploy/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {item.txHash.slice(0, 8)}...{item.txHash.slice(-8)}
                  </a>
                </div>
                {item.error && (
                  <div className="detail-item error">
                    <span className="detail-label">Error</span>
                    <span className="detail-value">{item.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <p>No execution history yet.</p>
          <p>Create and execute automation rules to see their history here.</p>
        </div>
      )}

      <div className="history-note">
        <p>
          <strong>Note:</strong> History is stored locally in your browser.
          Full transaction history can be viewed on{' '}
          <a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer">
            CSPR.live
          </a>
        </p>
      </div>
    </div>
  )
}

export default History
