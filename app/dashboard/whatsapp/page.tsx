'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { WhatsAppConnectionCard } from '@/components/whatsapp/WhatsAppConnectionCard'
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal'
import { ConversationActivityPanel } from '@/components/whatsapp/ConversationActivityPanel'
import { toast } from 'sonner'
import { WhatsAppAPI, initialWhatsAppState, type WhatsAppState } from '@/lib/whatsapp-provider'
import type { WhatsAppStatus } from '@/lib/types'

interface ActivityItem {
  id: string
  type: 'message' | 'ai_reply' | 'reconnect' | 'connected' | 'disconnected' | 'error'
  title: string
  description?: string
  timestamp: number
}

export default function WhatsAppIntegrationPage() {
  const { user, loading: authLoading } = useAuth()
  const [whatsappState, setWhatsappState] = useState<WhatsAppState>(initialWhatsAppState)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  // Load initial status
  useEffect(() => {
    if (!user) return
    loadStatus()
  }, [user])

  // Poll status when connecting
  useEffect(() => {
    if (!user || whatsappState.status !== 'connecting') return

    const interval = setInterval(() => {
      loadStatus()
    }, 2000)

    setPollInterval(interval)
    return () => clearInterval(interval)
  }, [user, whatsappState.status])

  async function loadStatus() {
    try {
      if (!user) return
      const status = await WhatsAppAPI.getStatus(user.uid)
      setWhatsappState(status)

      // If QR is pending, fetch it
      if (status.status === 'qr_pending') {
        try {
          const { qrCode } = await WhatsAppAPI.getQR(user.uid)
          setWhatsappState((prev) => ({ ...prev, qrCode }))
          setShowQRModal(true)
        } catch (err) {
          console.error('[WhatsApp] Failed to fetch QR:', err)
        }
      }
    } catch (err) {
      console.error('[WhatsApp] Failed to load status:', err)
    }
  }

  async function handleConnect() {
    if (!user) return
    setLoading(true)
    try {
      await WhatsAppAPI.connect(user.uid)
      addActivity('Connecting to WhatsApp...', 'connecting')
      setWhatsappState((prev) => ({ ...prev, status: 'connecting' }))
      toast.info('Initiating WhatsApp connection...')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      setWhatsappState((prev) => ({ ...prev, error: message }))
      addActivity(message, 'error', 'Connection failed')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!user) return
    setLoading(true)
    try {
      await WhatsAppAPI.disconnect(user.uid)
      setWhatsappState(initialWhatsAppState)
      addActivity('WhatsApp disconnected', 'disconnected')
      toast.success('WhatsApp disconnected')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect'
      addActivity(message, 'error', 'Disconnection failed')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReconnect() {
    if (!user) return
    setLoading(true)
    try {
      await WhatsAppAPI.reconnect(user.uid)
      addActivity('Attempting to reconnect...', 'reconnect')
      setWhatsappState((prev) => ({
        ...prev,
        status: 'reconnecting',
        reconnectAttempts: (prev.reconnectAttempts || 0) + 1,
      }))
      toast.info('Reconnecting to WhatsApp...')
      
      // Poll for reconnection
      let attempts = 0
      const checkReconnect = setInterval(async () => {
        attempts++
        const status = await WhatsAppAPI.getStatus(user.uid)
        setWhatsappState(status)
        
        if (status.status === 'connected') {
          clearInterval(checkReconnect)
          addActivity('WhatsApp reconnected', 'connected')
          toast.success('WhatsApp reconnected successfully')
        } else if (attempts > 30) {
          clearInterval(checkReconnect)
          toast.error('Reconnection timeout')
        }
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reconnect'
      addActivity(message, 'error', 'Reconnection failed')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function addActivity(
    title: string,
    type: ActivityItem['type'],
    description?: string,
  ) {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type,
      title,
      description,
      timestamp: Date.now(),
    }
    setActivities((prev) => [newActivity, ...prev].slice(0, 20))
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white">Please sign in to access WhatsApp integration</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Integration</h1>
            <p className="text-[#8892a4]">Connect your WhatsApp account to enable AI-powered messaging</p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Connection Card */}
            <div className="lg:col-span-2">
              <WhatsAppConnectionCard
                status={whatsappState.status}
                phoneNumber={whatsappState.phoneNumber}
                lastConnected={whatsappState.lastConnected}
                reconnectAttempts={whatsappState.reconnectAttempts || 0}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onReconnect={handleReconnect}
                loading={loading}
                error={whatsappState.error}
              />
            </div>

            {/* Right Column - Activity Panel */}
            <div>
              <ConversationActivityPanel activities={activities} loading={false} />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">How It Works</h2>
            <ul className="space-y-3 text-[#8892a4] text-sm">
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold mt-1">1.</span>
                <span>Click "Connect WhatsApp" to generate a QR code</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold mt-1">2.</span>
                <span>Open WhatsApp on your phone and go to Linked Devices</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold mt-1">3.</span>
                <span>Scan the QR code with your camera</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold mt-1">4.</span>
                <span>Once connected, AI will automatically respond to incoming messages</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        qrCode={whatsappState.qrCode}
        onClose={() => setShowQRModal(false)}
        loading={loading}
      />
    </div>
  )
}
