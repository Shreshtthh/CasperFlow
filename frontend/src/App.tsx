import { Routes, Route } from 'react-router-dom'
import { useCasperWallet } from './hooks/useCasperWallet'
import Header from './components/layout/Header'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import CreateAutomation from './pages/CreateAutomation'
import History from './pages/History'
import './App.css'

function App() {
  const wallet = useCasperWallet()

  // Create activeAccount object for compatibility with existing components
  const activeAccount = wallet.isConnected && wallet.publicKey ? {
    public_key: wallet.publicKey,
    balance: undefined,
  } : null

  return (
    <div className="app-container">
      <Header activeAccount={activeAccount} wallet={wallet} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing activeAccount={activeAccount} wallet={wallet} />} />
          <Route path="/dashboard" element={<Dashboard activeAccount={activeAccount} wallet={wallet} />} />
          <Route path="/create" element={<CreateAutomation activeAccount={activeAccount} wallet={wallet} />} />
          <Route path="/history" element={<History activeAccount={activeAccount} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
