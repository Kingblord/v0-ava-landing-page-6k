'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Copy, CheckCheck, Send, Loader2, SmartphoneNfc, Unplug } from 'lucide-react'

const GATEWAY = 'https://aromsg.onrender.com'

interface ChatMessage {
  id: string
  role: 'user' | 'bot' | 'system'
  text: string
  ts: number
}

export default function WhatsAppPage() {
  const { user } = useAuth()

  /* ── connection state ── */
  const [status, setStatus] = useState<'idle' | 'loading' | 'qr' | 'connected'>('idle')
  const [qrSrc, setQrSrc] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── chat state ── */
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'bot', text: 'Hi! Connect WhatsApp above, then send me a test message to verify your connection.', ts: Date.now() },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  /* ── webhook url ── */
  const [webhookUrl, setWebhookUrl] = useState('/api/whatsapp/webhook')
  const [copied, setCopied] = useState(false)
  const [initialising, setInitialising] = useState(true)

  // On mount: set webhook URL + check if session is already connected (persistence)
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)
  }, [])

  // Wait for auth then auto-check existing session
  useEffect(() => {
    if (!user) return
    checkExistingSession()
  }, [user])

  async function checkExistingSession() {
    setInitialising(true)
    try {
      const res = await fetch(`${GATEWAY}/status/${user!.uid}`)
      const data = await res.json()
      const already =
        data.status === 'connected' ||
        data.status === 'CONNECTED' ||
        data.connected === true ||
        data.state === 'open' ||
        data.state === 'connected' ||
        data.isConnected === true

      if (already) {
        const phoneNum = data.phone || data.phoneNumber || data.number || 'Connected'
        setStatus('connected')
        setPhone(phoneNum)
        addSystem(`Session restored. Phone: ${phoneNum}`)
      }
    } catch {
      // Gateway unreachable — start fresh
    } finally {
      setInitialising(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  /* ────────────────────────────────────────────
     EXACT same logic as the working HTML example
  ──────────────────────────────────────────── */
  async function handleConnect() {
    if (!user) return
    setStatus('loading')
    addSystem('Initiating session with gateway…')

    try {
      // 1. POST /connect  (exactly like HTML example)
      const res = await fetch(`${GATEWAY}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
      const data = await res.json()
      addSystem(`Gateway: ${JSON.stringify(data)}`)

      // 2. GET /qr/:userId
      const qrRes = await fetch(`${GATEWAY}/qr/${user.uid}`)
      const qrData = await qrRes.json()

      if (qrData.qr) {
        setQrSrc(qrData.qr)
        setStatus('qr')
        addSystem('QR code ready — scan with WhatsApp on your phone.')
      } else {
        addSystem('No QR returned. Session may already be active.')
        setStatus('idle')
      }

      // 3. Poll /status/:userId every second (same as HTML example)
      let attempts = 0
      let timedOut = false
      pollRef.current = setInterval(async () => {
        if (timedOut) return
        attempts++
        try {
          const sRes = await fetch(`${GATEWAY}/status/${user.uid}`)
          const sData = await sRes.json()

          // Log raw response so we know what the gateway actually returns
          console.log('[v0] poll status raw:', JSON.stringify(sData))

          // Handle all possible shapes the gateway may return
          const isConnected =
            sData.status === 'connected' ||
            sData.status === 'CONNECTED' ||
            sData.connected === true ||
            sData.state === 'open' ||
            sData.state === 'connected' ||
            sData.isConnected === true

          if (isConnected) {
            timedOut = true
            clearInterval(pollRef.current!)
            pollRef.current = null
            const phoneNum = sData.phone || sData.phoneNumber || sData.number || 'Connected'
            setStatus('connected')
            setPhone(phoneNum)
            setQrSrc('')
            addSystem(`Connected! Phone: ${phoneNum}`)
            toast.success('WhatsApp connected!')
            return
          }
        } catch { /* silent */ }

        if (attempts >= 120 && !timedOut) {
          timedOut = true
          clearInterval(pollRef.current!)
          pollRef.current = null
          addSystem('Timed out waiting for scan. Please try again.')
          setStatus('idle')
        }
      }, 1000)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addSystem(`Error: ${msg}`)
      toast.error(msg)
      setStatus('idle')
    }
  }

  async function handleDisconnect() {
    if (!user) return
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    try {
      await fetch(`${GATEWAY}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
    } catch { /* best effort */ }
    setStatus('idle')
    setQrSrc('')
    setPhone('')
    addSystem('Disconnected.')
    toast.info('Disconnected from WhatsApp')
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !user) return
    const text = input.trim()
    setInput('')
    setSending(true)

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text, ts: Date.now() }])

    try {
      const res = await fetch(`${GATEWAY}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to send')
      setMessages(prev => [...prev, { id: Date.now().toString() + 'b', role: 'bot', text: 'Message sent to WhatsApp.', ts: Date.now() }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      toast.error(msg)
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'system', text: `Error: ${msg}`, ts: Date.now() }])
    } finally {
      setSending(false)
    }
  }

  function addSystem(text: string) {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role: 'system', text, ts: Date.now() }])
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-slate-400">Please sign in</p>
    </div>
  )

  if (initialising) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3">
      <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
      <p className="text-slate-400 text-sm font-mono">Checking session…</p>
    </div>
  )

  const isConnected = status === 'connected'
  // Button is only disabled while the async connect flow is actively running
  const connectBusy = status === 'loading' || status === 'qr'

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-green-500/15 rounded-2xl">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-green-500">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            WhatsApp <span className="text-green-400">Gateway</span>
          </h1>
          <p className="text-slate-400 text-sm font-mono">aromsg.onrender.com</p>
        </div>

        {/* Live badge */}
        {isConnected && (
          <div className="ml-auto flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold font-mono">LIVE</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: QR Connection Panel ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Status indicator */}
          <div className={`rounded-2xl border p-5 transition-all ${
            isConnected
              ? 'bg-green-500/8 border-green-500/25'
              : 'bg-slate-900/60 border-slate-700/50'
          }`}
          style={{ backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-slate-600'}`} />
              <span className={`font-semibold text-sm ${isConnected ? 'text-green-400' : 'text-slate-400'}`}>
                {isConnected ? `Connected · ${phone}` : 'Disconnected'}
              </span>
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={connectBusy}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {status === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                ) : status === 'qr' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Waiting for scan…</>
                ) : (
                  <><SmartphoneNfc className="w-4 h-4" /> Connect WhatsApp</>
                )}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Unplug className="w-4 h-4" /> Disconnect
              </button>
            )}
          </div>

          {/* QR Code */}
          {status === 'qr' && qrSrc && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 flex flex-col items-center gap-4" style={{ backdropFilter: 'blur(12px)' }}>
              <p className="text-slate-300 text-sm font-semibold text-center">Scan with WhatsApp</p>
              <div className="bg-white p-3 rounded-xl shadow-xl">
                <img src={qrSrc} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
              </div>
              <p className="text-slate-500 text-xs text-center leading-relaxed">
                WhatsApp &rarr; Settings &rarr; Linked Devices &rarr; Link a Device
              </p>
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for scan…
              </div>
            </div>
          )}

          {/* Webhook URL */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5" style={{ backdropFilter: 'blur(12px)' }}>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Webhook URL</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-[#020617] border border-slate-700/50 rounded-lg px-3 py-2 text-green-400 text-xs font-mono truncate">
                {webhookUrl}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* AI toggle */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5" style={{ backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm font-semibold">AI Responses</p>
                <p className="text-slate-500 text-xs mt-0.5">Auto-reply to incoming messages</p>
              </div>
              <button
                onClick={() => setAiEnabled(v => !v)}
                disabled={!isConnected}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  aiEnabled ? 'bg-green-500' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  aiEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {aiEnabled && (
              <p className="text-green-400 text-xs font-mono mt-3">AI is active and responding</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat Test Interface ── */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden" style={{ backdropFilter: 'blur(12px)', minHeight: '560px' }}>

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50 bg-slate-900/80">
            <div className="relative">
              <img src="/cat-avatar.jpg" alt="Cat" className="w-10 h-10 rounded-full object-cover ring-2 ring-green-500/40" />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isConnected ? 'bg-green-400' : 'bg-slate-600'}`} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Test Connection</p>
              <p className="text-slate-400 text-xs">{isConnected ? `Active · ${phone}` : 'Connect WhatsApp to test'}</p>
            </div>
            {!isConnected && (
              <span className="ml-auto text-xs text-slate-500 font-mono bg-slate-800 px-3 py-1 rounded-full">
                Read-only
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <img src="/cat-avatar.jpg" alt="Cat" className="w-7 h-7 rounded-full object-cover self-end flex-shrink-0" />
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : msg.role === 'system'
                    ? 'bg-slate-800/80 text-slate-400 font-mono text-xs border border-slate-700/50 w-full rounded-lg'
                    : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                  {msg.role !== 'system' && (
                    <p className="text-[10px] opacity-50 mt-1 text-right">
                      {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 px-4 py-3 border-t border-slate-700/50 bg-slate-900/80"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isConnected || sending}
              placeholder={isConnected ? 'Send a test message…' : 'Connect WhatsApp first…'}
              className="flex-1 bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!isConnected || !input.trim() || sending}
              className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  )
}
