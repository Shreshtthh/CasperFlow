// Buffer polyfill for browser compatibility (casper-js-sdk uses Node.js Buffer)
import { Buffer } from 'buffer'
window.Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/common/Toast'
import App from './App'
import './index.css'

// Simple setup using native Casper Wallet extension
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
