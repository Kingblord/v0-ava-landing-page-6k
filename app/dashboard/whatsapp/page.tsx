'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Send, Copy, CheckCheck, Loader2, MessageCircle, QrCode, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  type: 'sent' | 'received' | 'system'
  text: string
  timestamp: number
}

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [qrCode, setQrCode] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [copied, setCopied] = useState(false)
  const [statusText, setStatusText] = useState('Disconnected')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const qrPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Hardcoded Gateway URL
  const GATEWAY_URL = 'https://aromsg.onrender.com'

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '/api/whatsapp/webhook'

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)
    }
  }, [])

  async function handleInitiateConnection() {
    if (!user) return
    setIsConnecting(true)
    setQrCode('')
    setStatusText('Connecting...')

    try {
      const response = await fetch(`${GATEWAY_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to connect')
      }

      setMessages([{
        id: Date.now().toString(),
        type: 'system',
        text: 'Connection initiated. Generating QR code...',
        timestamp: Date.now(),
      }])

      toast.success('Connection initiated. Scan QR when it appears.')
      startPolling()

    } catch (err: any) {
      const errorMsg = err.message || 'Connection failed'
      toast.error(errorMsg)
      setStatusText('Disconnected')
      setMessages([{
        id: Date.now().toString(),
        type: 'system',
        text: `Error: ${errorMsg}`,
        timestamp: Date.now(),
      }])
    } finally {
      setIsConnecting(false)
    }
  }

  function startPolling() {
    // QR Polling
    qrPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`\( {GATEWAY_URL}/qr/ \){user?.uid}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.qr) {
          setQrCode(data.qr)
        }
      } catch (err) {
        console.warn('[QR Poll] Error:', err)
      }
    }, 2000)

    // Status Polling
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`\( {GATEWAY_URL}/status/ \){user?.uid}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.connected) {
          setIsConnected(true)
          setPhoneNumber(data.phoneNumber || 'Connected')
          setStatusText('Connected')

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'system',
              text: `✅ Connected successfully as ${data.phoneNumber}`,
              timestamp: Date.now(),
            },
          ])

          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)

          toast.success('WhatsApp Connected Successfully!')
        }
      } catch (err) {
        console.warn('[Status Poll] Error:', err)
      }
    }, 2500)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !isConnected || !user) return

    const testMessage = messageText.trim()
    setMessageText('')
    setSendingMessage(true)

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: 'sent', text: testMessage, timestamp: Date.now() },
    ])

    try {
      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          to: "234XXXXXXXXXX@s.whatsapp.net",   // ← CHANGE THIS NUMBER
          text: testMessage,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Send failed')

      toast.success('Message sent successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleCopyWebhook() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Webhook URL copied!')
  }

  const handleDisconnect = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)

    setIsConnected(false)
    setQrCode('')
    setPhoneNumber('')
    setStatusText('Disconnected')
    setMessages([])
    toast.info('Disconnected from WhatsApp')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white">Please sign in to access WhatsApp integration</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] to-[#111827]">
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Integration</h1>
          <p className="text-[#8892a4]">Connect WhatsApp and test messaging</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: QR Code & Status */}
          <div className="lg:col-span-1">
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 sticky top-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#6C5CE7]" />
                  Connection Status
                </h2>

                <div className="p-3 bg-[#1a2235] rounded-lg border border-[#6C5CE7]/20 mb-4">
                  <p className="text-sm text-[#8892a4] font-mono">
                    Status: <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>{statusText}</span>
                  </p>
                  {phoneNumber && <p className="text-xs text-green-400 mt-1">{phoneNumber}</p>}
                </div>

                {!isConnected ? (
                  <div className="space-y-4">
                    {/* QR Code Display */}
                    {qrCode && (
                      <div className="bg-white p-6 rounded-2xl shadow-inner text-center">
                        <img src={qrCode} alt="WhatsApp QR Code" className="mx-auto w-full max-w-[260px]" />
                        <p className="text-xs text-gray-600 mt-4">Scan with WhatsApp → Linked Devices</p>
                      </div>
                    )}

                    <Button
                      onClick={handleInitiateConnection}
                      disabled={isConnecting}
                      className="w-full bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl gap-2"
                    >
                      {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Disconnect
                  </Button>
                )}
              </div>

              {/* Webhook URL */}
              <div className="border-t border-[#6C5CE7]/10 pt-4">
                <p className="text-xs text-[#8892a4] mb-2 font-mono">Webhook URL:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-[#0B0F1A] border border-[#6C5CE7]/20 rounded px-2 py-1.5 text-[#00D1B2] overflow-x-auto whitespace-nowrap">
                    {webhookUrl}
                  </code>
                  <button onClick={handleCopyWebhook} className="p-1.5 hover:bg-[#1a2235] rounded transition">
                    {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#8892a4]" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && !isConnected && (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <QrCode className="w-12 h-12 text-[#6C5CE7]/30 mx-auto mb-2" />
                      <p className="text-[#8892a4] text-sm">Connect WhatsApp to start testing messages</p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                      msg.type === 'system' ? 'bg-[#1a2235] text-[#8892a4] border border-[#6C5CE7]/20 w-full' :
                      msg.type === 'sent' ? 'bg-[#6C5CE7] text-white' : 'bg-[#1a2235] text-[#e2e8f0]'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {isConnected && (
                <form onSubmit={handleSendMessage} className="border-t border-[#6C5CE7]/15 p-4 flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Send a test message..."
                    disabled={sendingMessage}
                    className="bg-[#0B0F1A] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4]"
                  />
                  <Button type="submit" disabled={!messageText.trim() || sendingMessage} className="bg-[#6C5CE7] hover:bg-[#5548c7]">
                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}