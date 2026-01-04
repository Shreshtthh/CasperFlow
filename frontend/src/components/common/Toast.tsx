import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import './Toast.css'

interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    txHash?: string
}

interface ToastContextType {
    showToast: (type: Toast['type'], message: string, txHash?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((type: Toast['type'], message: string, txHash?: string) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, type, message, txHash }])

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 5000)
    }, [])

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'warning' && '⚠️'}
                            {toast.type === 'info' && 'ℹ️'}
                        </div>
                        <div className="toast-content">
                            <p className="toast-message">{toast.message}</p>
                            {toast.txHash && (
                                <a
                                    href={`https://testnet.cspr.live/deploy/${toast.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="toast-link"
                                >
                                    View transaction →
                                </a>
                            )}
                        </div>
                        <button className="toast-close" onClick={() => dismissToast(toast.id)}>
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
