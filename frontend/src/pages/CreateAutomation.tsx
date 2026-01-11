import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { useToast } from '../components/common/Toast'
import { TEMPLATES, SCHEDULES } from '../lib/constants'
import { createRuleDeploy, signAndSendDeploy } from '../lib/contractService'
import './CreateAutomation.css'

interface CreateAutomationProps {
  activeAccount: {
    public_key: string
    balance?: string
  } | null
}

function CreateAutomation({ activeAccount }: CreateAutomationProps) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    schedule: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeAccount) {
      navigate('/')
    }
  }, [activeAccount, navigate])

  const validateForm = (): string | null => {
    if (!selectedTemplate) {
      return 'Please select a template'
    }
    if (!formData.recipient) {
      return 'Please enter a recipient address'
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return 'Please enter a valid amount'
    }
    // Basic validation for Casper public key format
    if (formData.recipient.length < 64) {
      return 'Recipient must be a valid Casper public key (starts with 01 or 02)'
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      showToast('error', validationError)
      return
    }

    if (!activeAccount?.public_key) {
      showToast('error', 'Wallet not connected')
      return
    }

    const template = TEMPLATES.find(t => t.id === selectedTemplate)
    if (!template) {
      showToast('error', 'Invalid template')
      return
    }

    setLoading(true)
    try {
      const deploy = createRuleDeploy(
        activeAccount.public_key,
        template.name,
        template.triggerType,
        formData.schedule,
        template.actionType,
        formData.recipient,
        formData.amount
      )

      const result = await signAndSendDeploy(deploy, activeAccount.public_key)

      if (result?.deployHash) {
        showToast('success', `Rule created! TX: ${result.deployHash.slice(0, 8)}...`, result.deployHash)

        // Store in local history for MVP
        const historyKey = `history_${activeAccount.public_key}`
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
        existing.unshift({
          id: Date.now().toString(),
          ruleId: 0, // Will be set by contract
          ruleName: template.name,
          timestamp: Date.now(),
          amount: formData.amount,
          recipient: formData.recipient.slice(0, 8) + '...' + formData.recipient.slice(-4),
          success: true,
          txHash: result.deployHash,
        })
        localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 50)))

        navigate('/dashboard')
      }
    } catch (error: any) {
      if (error.message?.includes('cancelled')) {
        showToast('warning', 'Transaction cancelled by user')
      } else {
        showToast('error', error.message || 'Failed to create rule')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!activeAccount) {
    return null
  }

  return (
    <div className="create-container">
      <h1 className="page-title">Create Automation</h1>
      <p className="page-subtitle">Choose a template and configure your automation rule</p>

      <section className="section">
        <h2 className="section-title">1. Select Template</h2>
        <div className="templates-grid">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="template-icon">{template.icon}</div>
              <h3 className="template-name">{template.name}</h3>
              <p className="template-description">{template.description}</p>
            </div>
          ))}
        </div>
      </section>

      {selectedTemplate && (
        <section className="section">
          <h2 className="section-title">2. Configure Rule</h2>
          <div className="form-card">
            <div className="form-group">
              <label className="label">Recipient Address</label>
              <input
                type="text"
                className="input"
                placeholder="Enter recipient public key (e.g. 01abc...)"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              />
              <small className="input-hint">
                Full Casper public key starting with 01 (Ed25519) or 02 (Secp256k1)
              </small>
            </div>

            <div className="form-group">
              <label className="label">Amount (CSPR)</label>
              <input
                type="number"
                className="input"
                placeholder="Enter amount"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">Schedule</label>
              <select
                className="select"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: parseInt(e.target.value) })}
              >
                {SCHEDULES.map((schedule) => (
                  <option key={schedule.value} value={schedule.value}>
                    {schedule.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-preview">
              <strong>Preview:</strong> Send {formData.amount || '?'} CSPR to {formData.recipient ? `${formData.recipient.slice(0, 8)}...` : '?'} every {SCHEDULES.find(s => s.value === formData.schedule)?.label.toLowerCase()}
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default CreateAutomation
