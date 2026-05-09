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

  // Gateway URL - same as the HTML example
  const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.render.com'

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
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  async function handleInitiateConnection() {
    if (!user) return
    setIsConnecting(true)

    try {
      console.log('[initiate] Calling gateway:', `${GATEWAY_URL}/connect`)

      // Call gateway directly - same as the HTML example
      const response = await fetch(`${GATEWAY_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      const data = await response.json()
      console.log('[initiate] Response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to connect')
      }

      // Get QR code directly from gateway - same as the HTML example
      try {
        const qrResponse = await fetch(`${GATEWAY_URL}/qr/${user.uid}`)
        const qrData = await qrResponse.json()
        console.log('[qr] Response:', qrData)

        if (qrData.qr) {
          setQrCode(qrData.qr)
          console.log('[qr] QR code set')
        }
      } catch (err) {
        console.warn('[qr] Could not fetch QR:', err)
      }

      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          text: 'Scan the QR code with your WhatsApp phone to connect.',
          timestamp: Date.now(),
        },
      ])

      // Start polling for connection status
      let pollCount = 0
      const maxPolls = 120 // 2 minutes with 1-second intervals

      pollIntervalRef.current = setInterval(async () => {
        pollCount++

        try {
          // Check status directly from gateway - same as the HTML example
          const statusResponse = await fetch(`${GATEWAY_URL}/status/${user.uid}`)
          const statusData = await statusResponse.json()

          console.log('[poll] Status:', statusData)

          if (statusData.status === 'connected') {
            setIsConnected(true)
            setPhoneNumber(statusData.phone || 'Connected')
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: 'system',
                text: `Connected successfully! Phone: ${statusData.phone || 'Unknown'}`,
                timestamp: Date.now(),
              },
            ])

            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            toast.success('Connected!')
          }
        } catch (err) {
          console.warn('[poll] Error:', err)
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }

          if (!isConnected) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: 'system',
                text: 'Connection timeout. Please try scanning again.',
                timestamp: Date.now(),
              },
            ])
          }
        }
      }, 1000)

      toast.success('Scan QR code to connect')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed'
      console.error('[initiate] Error:', err)
      toast.error(errorMsg)
      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          text: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !isConnected || !user) return

    const testMessage = messageText.trim()
    setMessageText('')
    setSendingMessage(true)

    try {
      // Add to local messages
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'sent',
          text: testMessage,
          timestamp: Date.now(),
        },
      ])

      console.log('[send] Sending message via gateway:', `${GATEWAY_URL}/send-message`)

      // Send via gateway directly - same as the HTML example
      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          message: testMessage,
        }),
      })

      const result = await response.json()
      console.log('[send] Response:', result)

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to send message')
      }

      toast.success('Message sent')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send'
      console.error('[send] Error:', err)
      toast.error(errorMsg)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleCopyWebhook() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Integration</h1>
          <p className="text-[#8892a4]">Connect WhatsApp and test messaging</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: QR Code Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 sticky top-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#6C5CE7]" />
                  Connection Status
                </h2>

                {!isConnected ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#1a2235] rounded-lg border border-[#6C5CE7]/20">
                      <p className="text-sm text-[#8892a4] font-mono">
                        Status: <span className="text-yellow-400">Disconnected</span>
                      </p>
                    </div>

                    {qrCode && (
                      <div className="bg-white p-4 rounded-lg">
                        <img src={qrCode} alt="WhatsApp QR Code" className="w-full" />
                        <p className="text-xs text-center text-gray-600 mt-2">
                          Scan with WhatsApp
                        </p>
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
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-sm text-green-400 font-mono">
                        Status: <span className="font-bold">Connected</span>
                      </p>
                      <p className="text-xs text-green-400/80 mt-1">{phoneNumber}</p>
                    </div>

                    <Button
                      onClick={() => {
                        setIsConnected(false)
                        setQrCode('')
                        setMessages([])
                        if (pollIntervalRef.current) {
                          clearInterval(pollIntervalRef.current)
                        }
                        toast.info('Disconnected from WhatsApp')
                      }}
                      variant="outline"
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>

              {/* Webhook URL */}
              <div className="border-t border-[#6C5CE7]/10 pt-4">
                <p className="text-xs text-[#8892a4] mb-2 font-mono">Webhook URL:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-[#0B0F1A] border border-[#6C5CE7]/20 rounded px-2 py-1.5 text-[#00D1B2] overflow-x-auto whitespace-nowrap">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={handleCopyWebhook}
                    className="p-1.5 hover:bg-[#1a2235] rounded transition"
                  >
                    {copied ? (
                      <CheckCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#8892a4]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && !isConnected && (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <QrCode className="w-12 h-12 text-[#6C5CE7]/30 mx-auto mb-2" />
                      <p className="text-[#8892a4] text-sm">
                        Connect WhatsApp to start testing messages
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === 'sent' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                        msg.type === 'system'
                          ? 'bg-[#1a2235] text-[#8892a4] border border-[#6C5CE7]/20 w-full'
                          : msg.type === 'sent'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[#1a2235] text-[#e2e8f0]'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isConnected && (
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-[#6C5CE7]/15 p-4 flex gap-2"
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Send a test message..."
                    disabled={sendingMessage}
                    className="bg-[#0B0F1A] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4]"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendingMessage}
                    className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="mt-4 text-xs text-[#8892a4] bg-[#111827] border border-[#6C5CE7]/15 rounded-xl p-3">
              <p className="font-mono">
                Gateway: {GATEWAY_URL}
              </p>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
