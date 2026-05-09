'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Send, Copy, CheckCheck, Loader2, MessageCircle, QrCode } from 'lucide-react'

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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const qrPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Make sure this is correct
  const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.onrender.com'

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '/api/whatsapp/webhook'

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup
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

      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          text: 'Connection initiated. Generating QR code...',
          timestamp: Date.now(),
        },
      ])

      toast.success('Connection initiated. Scan QR when it appears.')

      // Start polling
      startPolling()

    } catch (err: any) {
      const errorMsg = err.message || 'Connection failed'
      toast.error(errorMsg)
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
        const data = await res.json()

        if (data.connected) {
          setIsConnected(true)
          setPhoneNumber(data.phoneNumber || 'Connected')

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'system',
              text: `✅ Connected successfully as ${data.phoneNumber}`,
              timestamp: Date.now(),
            },
          ])

          // Stop polling on success
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
      {
        id: Date.now().toString(),
        type: 'sent',
        text: testMessage,
        timestamp: Date.now(),
      },
    ])

    try {
      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          to: "234XXXXXXXXXX@s.whatsapp.net", // ← Change this number for testing
          text: testMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Send failed')

      toast.success('Message sent')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
      setMessages(prev => prev.slice(0, -1)) // Remove optimistic message
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleCopyWebhook() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Webhook URL copied')
  }

  const handleDisconnect = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)

    setIsConnected(false)
    setQrCode('')
    setPhoneNumber('')
    setMessages([])
    toast.info('Disconnected')
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
          {/* QR & Status Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#6C5CE7]" />
                Connection Status
              </h2>

              {!isConnected ? (
                <div className="space-y-6">
                  <Button
                    onClick={handleInitiateConnection}
                    disabled={isConnecting}
                    className="w-full bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl gap-2 h-12"
                  >
                    {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
                  </Button>

                  {/* Improved QR Display */}
                  {qrCode && (
                    <div className="bg-white p-6 rounded-2xl shadow-inner">
                      <img 
                        src={qrCode} 
                        alt="WhatsApp QR Code" 
                        className="mx-auto w-full max-w-[280px]"
                      />
                      <p className="text-center text-sm text-gray-600 mt-4 font-medium">
                        Scan with WhatsApp on your phone
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <p className="text-green-400 font-semibold">✅ Connected</p>
                    <p className="text-green-400/80 text-sm mt-1">{phoneNumber}</p>
                  </div>

                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Disconnect
                  </Button>
                </div>
              )}

              {/* Webhook */}
              <div className="mt-8 pt-6 border-t border-[#6C5CE7]/10">
                <p className="text-xs text-[#8892a4] mb-2">Webhook URL</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-[#0B0F1A] border border-[#6C5CE7]/20 rounded px-3 py-3 text-emerald-400 overflow-auto">
                    {webhookUrl}
                  </code>
                  <button onClick={handleCopyWebhook} className="p-2 hover:bg-[#1a2235] rounded">
                    {copied ? <CheckCheck className="text-green-400" /> : <Copy />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl flex flex-col h-[620px]">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <QrCode className="w-16 h-16 text-[#6C5CE7]/30 mb-4" />
                    <p className="text-[#8892a4]">Connect WhatsApp to begin testing</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                        msg.type === 'system'
                          ? 'bg-[#1a2235] text-[#8892a4] border border-[#6C5CE7]/20 w-full'
                          : msg.type === 'sent'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[#1a2235] text-white'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {isConnected && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#6C5CE7]/15">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type test message..."
                      disabled={sendingMessage}
                      className="bg-[#0B0F1A] border-[#6C5CE7]/25"
                    />
                    <Button type="submit" disabled={!messageText.trim() || sendingMessage}>
                      {sendingMessage ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}