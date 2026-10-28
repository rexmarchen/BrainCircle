import { useEffect, useState } from 'react'
import { roomBackend } from '@/services'

export type ConnectionStatus = 'connecting' | 'online' | 'offline'

export interface ConnectionState {
  status: ConnectionStatus
  online: boolean
  browserOnline: boolean
}

export function useConnectionStatus(): ConnectionState {
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null)
  const [browserOnline, setBrowserOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )

  useEffect(() => {
    const unsubscribe = roomBackend.subscribeConnection(setFirebaseConnected)
    const update = () => setBrowserOnline(navigator.onLine !== false)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      unsubscribe()
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!browserOnline) return { status: 'offline', online: false, browserOnline }
  if (firebaseConnected === null) return { status: 'connecting', online: false, browserOnline }
  return firebaseConnected
    ? { status: 'online', online: true, browserOnline }
    : { status: 'offline', online: false, browserOnline }
}
