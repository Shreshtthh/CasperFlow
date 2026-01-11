import { useRef, useState, useEffect, useCallback } from 'react'
import { getAccountBalance } from '../lib/casperRpc'

interface UseCasperWalletReturn {
    isAvailable: boolean
    isConnected: boolean
    isConnecting: boolean
    publicKey: string | null
    balance: string | null
    error: string | null
    connect: () => Promise<boolean>
    disconnect: () => Promise<void>
    getActivePublicKey: () => Promise<string | null>
    refreshBalance: () => Promise<void>
}

export function useCasperWallet(): UseCasperWalletReturn {
    const [isAvailable, setIsAvailable] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const [balance, setBalance] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const providerRef = useRef<any>(null)

    // Get Casper Wallet Provider
    const getProvider = useCallback(() => {
        if (typeof window === 'undefined') return null

        const CasperWalletProvider = (window as any).CasperWalletProvider
        if (!CasperWalletProvider) {
            return null
        }

        if (!providerRef.current) {
            providerRef.current = CasperWalletProvider({ timeout: 30 * 60 * 1000 })
        }

        return providerRef.current
    }, [])

    // Check if wallet extension is available
    useEffect(() => {
        if (typeof window === 'undefined') return

        const checkWallet = () => {
            if ((window as any).CasperWalletProvider) {
                setIsAvailable(true)
                console.log('Casper Wallet extension found!')
                return true
            }
            return false
        }

        // Check immediately
        if (checkWallet()) return

        // Check periodically (wallet might load late)
        const interval = setInterval(() => {
            if (checkWallet()) {
                clearInterval(interval)
            }
        }, 500)

        // Stop after 10 seconds
        const timeout = setTimeout(() => {
            clearInterval(interval)
            if (!isAvailable) {
                console.log('Casper Wallet extension not found after 10s')
            }
        }, 10000)

        return () => {
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [isAvailable])

    // Listen for wallet events
    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleConnected = (event: any) => {
            console.log('Wallet connected:', event.detail)
            if (event.detail?.activeKey) {
                setPublicKey(event.detail.activeKey)
                setIsConnected(true)
            }
        }

        const handleDisconnected = () => {
            console.log('Wallet disconnected')
            setPublicKey(null)
            setIsConnected(false)
        }

        const handleActiveKeyChanged = (event: any) => {
            console.log('Active key changed:', event.detail)
            if (event.detail?.activeKey) {
                setPublicKey(event.detail.activeKey)
            }
        }

        window.addEventListener('casper-wallet:connected', handleConnected)
        window.addEventListener('casper-wallet:disconnected', handleDisconnected)
        window.addEventListener('casper-wallet:activeKeyChanged', handleActiveKeyChanged)

        return () => {
            window.removeEventListener('casper-wallet:connected', handleConnected)
            window.removeEventListener('casper-wallet:disconnected', handleDisconnected)
            window.removeEventListener('casper-wallet:activeKeyChanged', handleActiveKeyChanged)
        }
    }, [])

    // Check if already connected on mount
    useEffect(() => {
        const checkConnection = async () => {
            const provider = getProvider()
            if (!provider) return

            try {
                const connected = await provider.isConnected()
                if (connected) {
                    const key = await provider.getActivePublicKey()
                    if (key) {
                        setPublicKey(key)
                        setIsConnected(true)
                    }
                }
            } catch (err) {
                console.log('Error checking connection:', err)
            }
        }

        if (isAvailable) {
            checkConnection()
        }
    }, [isAvailable, getProvider])

    const connect = async (): Promise<boolean> => {
        setError(null)
        setIsConnecting(true)

        try {
            const provider = getProvider()

            if (!provider) {
                setError('Casper Wallet extension not found. Please install the Casper Wallet extension.')
                return false
            }

            const connected = await provider.requestConnection()

            if (connected) {
                const key = await provider.getActivePublicKey()
                if (key) {
                    setPublicKey(key)
                    setIsConnected(true)
                    return true
                }
            } else {
                setError('Connection denied by user.')
            }

            return false
        } catch (err: any) {
            console.error('Wallet connection error:', err)

            if (err.code === 1) {
                setError('Wallet is locked. Please open Casper Wallet extension and unlock it.')
            } else {
                setError(err.message || 'Wallet connection failed')
            }

            return false
        } finally {
            setIsConnecting(false)
        }
    }

    const disconnect = async (): Promise<void> => {
        try {
            const provider = getProvider()
            if (provider) {
                await provider.disconnectFromSite()
            }
            setPublicKey(null)
            setBalance(null)
            setIsConnected(false)
        } catch (err) {
            console.error('Disconnect error:', err)
        }
    }

    const getActivePublicKey = async (): Promise<string | null> => {
        try {
            const provider = getProvider()
            if (provider) {
                return await provider.getActivePublicKey()
            }
            return null
        } catch (err) {
            console.error('Error getting public key:', err)
            return null
        }
    }

    const refreshBalance = async (): Promise<void> => {
        if (publicKey) {
            try {
                const bal = await getAccountBalance(publicKey)
                setBalance(bal)
            } catch (err) {
                console.error('Error fetching balance:', err)
            }
        }
    }

    // Fetch balance when public key changes
    useEffect(() => {
        if (publicKey) {
            refreshBalance()
        }
    }, [publicKey])

    return {
        isAvailable,
        isConnected,
        isConnecting,
        publicKey,
        balance,
        error,
        connect,
        disconnect,
        getActivePublicKey,
        refreshBalance,
    }
}
