import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './History.css'

interface HistoryProps {
  activeAccount: {
    public_key: string
    balance?: string
  } | null
}

const mockHistory = [
  {
    id: 1,
    ruleName: 'Recurring Payment',
    timestamp: Date.now() - 3600000,
    amount: '100',
    recipient: '0123...abcd',
    success: true,
    txHash: '08c77fecb901a8aacc9824891abc741d7c6e23e5c7b583c1374c175e063ce346',
  },
  {
    id: 2,
    ruleName: 'Auto-Savings',
    timestamp: Date.now() - 86400000,
    amount: '50',
    recipient: '9876...wxyz',
    success: true,
    txHash: 'c7a06dbd1603ae611875b979aff078ca8d0fc849f5e3e9382585d5fd21fa66f2',
  },
  {
    id: 3,
    ruleName: 'Recurring Payment',
    timestamp: Date.now() - 172800000,
    amount: '100',
    recipient: '0123...abcd',
    success: false,
    txHash: '03f653a77ae52d6891fde2f98d721708319f69705366119ca4f0636b4e20718c',
  },
]

function History({ activeAccount }: HistoryProps) {
  const navigate = useNavigate()
  const [history] = useState(mockHistory)

  useEffect(() => {
    if (!activeAccount) {
      navigate('/')
    }
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

  if (!activeAccount) {
    return null
  }

  return (
    <div className="history-container">
      <h1 className="page-title">Execution History</h1>
      <p className="page-subtitle">Track all your automation rule executions</p>

      {history.length > 0 ? (
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
                    href={`https://testnet.cspr.live/transaction/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {item.txHash.slice(0, 8)}...{item.txHash.slice(-8)}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <p>No execution history yet.</p>
          <p>Your automation executions will appear here.</p>
        </div>
      )}
    </div>
  )
}

export default History
