import Button from '../common/Button'
import { RULE_STATUS } from '../../lib/constants'
import './RuleCard.css'

interface Rule {
  id: number
  template_name: string
  status: number
  next_execution: number
  amount: string
  recipient: string
}

interface RuleCardProps {
  rule: Rule
  onPause: () => void
  onDelete: () => void
}

function RuleCard({ rule, onPause, onDelete }: RuleCardProps) {
  const formatNextExecution = (timestamp: number, status: number) => {
    if (status === 1) return '—'
    if (timestamp === 0) return '—'
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusClass = rule.status === 0 ? 'status-active' : 'status-paused'

  return (
    <div className="rule-card">
      <div className="card-header">
        <h3 className="template-name">{rule.template_name}</h3>
        <span className={`status-badge ${statusClass}`}>
          {RULE_STATUS[rule.status as keyof typeof RULE_STATUS]}
        </span>
      </div>

      <div className="rule-details">
        <div className="detail-row">
          <span className="detail-label">Amount</span>
          <span className="detail-value">{rule.amount} CSPR</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Recipient</span>
          <span className="detail-value">{rule.recipient}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Next Execution</span>
          <span className="detail-value">{formatNextExecution(rule.next_execution, rule.status)}</span>
        </div>
      </div>

      <div className="rule-actions">
        <Button variant="secondary" size="small" onClick={onPause}>
          {rule.status === 0 ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="danger" size="small" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}

export default RuleCard
