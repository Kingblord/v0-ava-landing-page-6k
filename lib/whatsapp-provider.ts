import type { WhatsAppStatus } from './types'

export interface WhatsAppState {
  status: WhatsAppStatus
  phoneNumber?: string
  qrCode?: string
  lastConnected?: number
  error?: string
  reconnectAttempts: number
}

export const initialWhatsAppState: WhatsAppState = {
  status: 'disconnected',
  reconnectAttempts: 0,
}

// API endpoints for WhatsApp integration
export const WhatsAppAPI = {
  connect: async (userId: string) => {
    const response = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!response.ok) throw new Error('Failed to connect WhatsApp')
    return response.json()
  },

  disconnect: async (userId: string) => {
    const response = await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!response.ok) throw new Error('Failed to disconnect WhatsApp')
    return response.json()
  },

  getStatus: async (userId: string) => {
    const response = await fetch(`/api/whatsapp/status?userId=${userId}`)
    if (!response.ok) throw new Error('Failed to get WhatsApp status')
    return response.json() as Promise<WhatsAppState>
  },

  getQR: async (userId: string) => {
    const response = await fetch(`/api/whatsapp/qr?userId=${userId}`)
    if (!response.ok) throw new Error('Failed to get QR code')
    return response.json() as Promise<{ qrCode: string }>
  },

  reconnect: async (userId: string) => {
    const response = await fetch('/api/whatsapp/reconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!response.ok) throw new Error('Failed to reconnect WhatsApp')
    return response.json()
  },
}

// Format status for display
export function formatWhatsAppStatus(status: WhatsAppStatus): string {
  const statusLabels: Record<WhatsAppStatus, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    qr_pending: 'Scan QR Code',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
  }
  return statusLabels[status]
}
