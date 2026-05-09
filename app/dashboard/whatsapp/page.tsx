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

  // ✅ Correct Gateway URL
  const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.onrender.com'

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

    try {
      console.log('[initiate] Calling gateway:', `${GATEWAY_URL}/connect`)

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

      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          text: 'Scan the QR code with your WhatsApp phone to connect.',
          timestamp: Date.now(),
        },
      ])

      toast.success('Connection initiated. Waiting for QR code...')

      // Start polling QR and Status
      startPolling()

    } catch (err: any) {
      const errorMsg = err.message || 'Connection failed'
      console.error('[initiate] Error:', err)
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
    // QR Code Polling
    qrPollIntervalRef.current = setInterval(async () => {
      try {
        const qrResponse = await fetch(`\( {GATEWAY_URL}/qr/ \){user?.uid}`)
        const qrData = await qrResponse.json()
        console.log('[qr] Response:', qrData)

        if (qrData.qr) {
          setQrCode(qrData.qr)
        }
      } catch (err) {
        console.warn('[qr] Could not fetch QR:', err)
      }
    }, 2000)

    // Status Polling
    let pollCount = 0
    const maxPolls = 120

    pollIntervalRef.current = setInterval(async () => {
      pollCount++

      try {
        const statusResponse = await fetch(`\( {GATEWAY_URL}/status/ \){user?.uid}`)
        const statusData = await statusResponse.json()

        console.log('[poll] Status:', statusData)

        if (statusData.connected) {
          setIsConnected(true)
          setPhoneNumber(statusData.phoneNumber || 'Connected')

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'system',
              text: `✅ Connected successfully! Phone: ${statusData.phoneNumber || 'Unknown'}`,
              timestamp: Date.now(),
            },
          ])

          // Stop polling
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)

          toast.success('WhatsApp Connected Successfully!')
        }
      } catch (err) {
        console.warn('[poll] Error:', err)
      }

      if (pollCount >= maxPolls && !isConnected) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'system',
            text: 'Connection timeout. Please try again.',
            timestamp: Date.now(),
          },
        ])
      }
    }, 1500)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !isConnected || !user) return

    const testMessage = messageText.trim()
    setMessageText('')
    setSendingMessage(true)

    // Optimistic UI
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
      console.log('[send] Sending message via gateway')

      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          to: "234XXXXXXXXXX@s.whatsapp.net", // ← Change this or make dynamic
          text: testMessage,
        }),
      })

      const result = await response.json()
      console.log('[send] Response:', result)

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to send message')
      }

      toast.success('Message sent successfully')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send'
      console.error('[send] Error:', err)
      toast.error(errorMsg)

      // Remove optimistic message on failure
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
                          Scan with WhatsApp → Linked Devices
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
                      onClick={handleDisconnect}
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
          </div>
        </div>
      </main>
    </div>
  )
}

On Sat, 9 May 2026, 09:02 ALUSI BLOCKCHAIN, <alusiweb3.eteakwu@gmail.com> wrote:
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const qrPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Correct Gateway URL
  const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.onrender.com'

  const webhookUrl = typeof window !== 'undefined' 
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
        throw new Error(data.error || 'Failed to initiate connection')
      }

      toast.success('Connection initiated. Generating QR...')

      // Start polling for QR and Status
      startPolling()

    } catch (err: any) {
      toast.error(err.message || 'Connection failed')
      setMessages([{
        id: Date.now().toString(),
        type: 'system',
        text: `Error: ${err.message}`,
        timestamp: Date.now(),
      }])
    } finally {
      setIsConnecting(false)
    }
  }

  function startPolling() {
    // QR Code Polling
    qrPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`\( {GATEWAY_URL}/qr/ \){user?.uid}`)
        const data = await res.json()

        if (data.qr) {
          setQrCode(data.qr)
        }
      } catch (err) {
        console.warn('QR poll error:', err)
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
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'system',
            text: `✅ Connected successfully as ${data.phoneNumber}`,
            timestamp: Date.now(),
          }])

          // Stop polling
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)
          
          toast.success('WhatsApp Connected!')
        }
      } catch (err) {
        console.warn('Status poll error:', err)
      }
    }, 3000)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !isConnected || !user) return

    const text = messageText.trim()
    setMessageText('')
    setSendingMessage(true)

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'sent',
      text,
      timestamp: Date.now(),
    }])

    try {
      const response = await fetch(`${GATEWAY_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          to: "YOUR_TEST_NUMBER@s.whatsapp.net", // Change this or make it dynamic
          text: text
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to send')

      toast.success('Message sent successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
      
      // Remove optimistic message on failure
      setMessages(prev => prev.slice(0, -1))
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

  const disconnect = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (qrPollIntervalRef.current) clearInterval(qrPollIntervalRef.current)
    
    setIsConnected(false)
    setQrCode('')
    setPhoneNumber('')
    setMessages([])
    toast.info('Disconnected')
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-white">Please sign in</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] to-[#111827] p-6">
      <main className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">WhatsApp Integration</h1>
        <p className="text-gray-400 mb-8">Connect your WhatsApp and test messaging</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR & Status Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-[#111827] border border-[#6C5CE7]/20 rounded-3xl p-8 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-8 h-8 text-[#6C5CE7]" />
                <h2 className="text-2xl font-semibold">Connection</h2>
              </div>

              {!isConnected ? (
                <>
                  <Button 
                    onClick={handleInitiateConnection}
                    disabled={isConnecting}
                    className="w-full bg-[#6C5CE7] hover:bg-[#5a4ed1] h-14 text-lg"
                  >
                    {isConnecting ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
                  </Button>

                  {qrCode && (
                    <div className="mt-8 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-2xl">
                        <img src={qrCode} alt="QR Code" className="w-64" />
                      </div>
                      <p className="text-center text-sm text-gray-400 mt-4">
                        Scan with WhatsApp → Linked Devices
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                    <div className="text-green-400 text-xl font-semibold">✅ Connected</div>
                    <p className="text-green-400/80 mt-1">{phoneNumber}</p>
                  </div>

                  <Button onClick={disconnect} variant="destructive" className="w-full">
                    Disconnect WhatsApp
                  </Button>
                </div>
              )}

              {/* Webhook Info */}
              <div className="mt-10 pt-6 border-t border-gray-700">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Webhook URL</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-black/50 p-3 rounded-xl text-xs text-emerald-400 break-all">
                    {webhookUrl}
                  </code>
                  <Button size="icon" onClick={handleCopyWebhook} variant="outline">
                    {copied ? <CheckCheck className="text-green-400" /> : <Copy />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-7">
            <div className="bg-[#111827] border border-[#6C5CE7]/20 rounded-3xl h-[650px] flex flex-col">
              <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">WhatsApp Chat</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Connect WhatsApp to start testing</p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[15px] ${
                      msg.type === 'sent' 
                        ? 'bg-[#6C5CE7] text-white' 
                        : msg.type === 'system'
                        ? 'bg-gray-800 text-gray-300 border border-gray-700'
                        : 'bg-gray-800 text-white'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {isConnected && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-black/50 border-gray-700"
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