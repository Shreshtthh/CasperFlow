import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { TEMPLATES, SCHEDULES } from '../lib/constants'
import './CreateAutomation.css'

interface WalletState {
  isAvailable: boolean
  isConnected: boolean
  isConnecting: boolean
  publicKey: string | null
  error: string | null
  connect: () => Promise<boolean>
  disconnect: () => Promise<void>
}

interface CreateAutomationProps {
  activeAccount: {
    public_key: string
    balance?: string
  } | null
  wallet?: WalletState
}

function CreateAutomation({ activeAccount, wallet }: CreateAutomationProps) {
  const navigate = useNavigate()
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

  const handleSubmit = async () => {
    if (!selectedTemplate || !formData.recipient || !formData.amount) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    console.log('Creating rule:', { template: selectedTemplate, ...formData })

    setTimeout(() => {
      setLoading(false)
      alert('Rule created successfully!')
      navigate('/dashboard')
    }, 1500)
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
                placeholder="Enter recipient public key"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">Amount (CSPR)</label>
              <input
                type="number"
                className="input"
                placeholder="Enter amount"
                min="1"
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
