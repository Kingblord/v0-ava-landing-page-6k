'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import {
  Copy, CheckCheck, Send, Loader2, SmartphoneNfc, Unplug,
  Bot, User, Settings2, ChevronRight, Plus, Search, Trash2
} from 'lucide-react'

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.onrender.com'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'bot' | 'system'
  text: string
  ts: number
}

interface Contact {
  id: string          // phone JID e.g. 2348012345678@s.whatsapp.net
  name: string        // display name
  phone: string       // raw number
  lastMessage?: string
  lastTs?: number
  unread?: number
  // Per-contact AI settings
  aiEnabled: boolean
  aiPersonality?: string
  aiModel?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isConnectedData(d: any) {
  return (
    d?.status === 'connected' ||
    d?.status === 'CONNECTED' ||
    d?.connected === true ||
    d?.state === 'open' ||
    d?.state === 'connected' ||
    d?.isConnected === true
  )
}

function phoneFromJid(jid: string) {
  return jid.replace(/@.*/, '')
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { user } = useAuth()

  // Connection
  const [status, setStatus]   = useState<'idle' | 'loading' | 'qr' | 'connected'>('idle')
  const [qrSrc, setQrSrc]     = useState('')
  const [phone, setPhone]     = useState('')
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCheckedRef         = useRef(false)
  const [initialising, setInitialising] = useState(false)

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('/api/whatsapp/webhook')
  const [copied, setCopied]         = useState(false)

  // Contact list
  const [contacts, setContacts]           = useState<Contact[]>([])
  const [selected, setSelected]           = useState<Contact | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newPhone, setNewPhone]           = useState('')
  const [newName, setNewName]             = useState('')

  // Chat (for selected contact)
  const [convos, setConvos]   = useState<Record<string, ChatMessage[]>>({})
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  // AI settings panel
  const [showAiPanel, setShowAiPanel] = useState(false)

  // Global AI toggle (new-message auto-reply)
  const [globalAi, setGlobalAi] = useState(false)

  // ── Initialise ──────────────────────────────────────────────────────────────

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)
  }, [])

  useEffect(() => {
    if (!user || hasCheckedRef.current) return
    hasCheckedRef.current = true
    checkExistingSession()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convos, selected])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── Session helpers ─────────────────────────────────────────────────────────

  async function checkExistingSession() {
    if (!user) return
    setInitialising(true)
    try {
      const res  = await fetch(`${GATEWAY}/status/${user.uid}`)
      const data = await res.json()
      if (isConnectedData(data)) {
        const num = data.phone || data.phoneNumber || data.number || 'Connected'
        setStatus('connected')
        setPhone(num)
        addSystem('__global__', `Session restored. Phone: ${num}`)
      }
    } catch {
      // Gateway offline — show idle, let user click connect
    } finally {
      setInitialising(false)
    }
  }

  async function handleConnect() {
    if (!user) return
    setStatus('loading')
    addSystem('__global__', 'Initiating session with gateway…')

    try {
      // 1. POST /connect
      const res  = await fetch(`${GATEWAY}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
      await res.json()

      // 2. GET /qr/:userId
      const qrRes  = await fetch(`${GATEWAY}/qr/${user.uid}`)
      const qrData = await qrRes.json()

      if (qrData.qr) {
        setQrSrc(qrData.qr)
        setStatus('qr')
        addSystem('__global__', 'QR code ready — scan with WhatsApp on your phone.')
      } else if (isConnectedData(qrData)) {
        // Already connected (session persisted on gateway)
        const num = qrData.phone || qrData.phoneNumber || 'Connected'
        setStatus('connected')
        setPhone(num)
        addSystem('__global__', `Already connected. Phone: ${num}`)
        return
      } else {
        addSystem('__global__', 'No QR returned yet — retrying…')
        setStatus('idle')
        return
      }

      // 3. Poll /status/:userId every second
      let attempts = 0
      let done     = false
      pollRef.current = setInterval(async () => {
        if (done) return
        attempts++
        try {
          const sRes  = await fetch(`${GATEWAY}/status/${user.uid}`)
          const sData = await sRes.json()

          if (isConnectedData(sData)) {
            done = true
            clearInterval(pollRef.current!)
            pollRef.current = null
            const num = sData.phone || sData.phoneNumber || sData.number || 'Connected'
            setStatus('connected')
            setPhone(num)
            setQrSrc('')
            addSystem('__global__', `Connected! Phone: ${num}`)
            toast.success('WhatsApp connected!')
          }
        } catch { /* silent */ }

        if (attempts >= 120 && !done) {
          done = true
          clearInterval(pollRef.current!)
          pollRef.current = null
          addSystem('__global__', 'Timed out. Please try again.')
          setStatus('idle')
        }
      }, 1000)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addSystem('__global__', `Error: ${msg}`)
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
    addSystem('__global__', 'Disconnected.')
    toast.info('Disconnected from WhatsApp')
  }

  // ── Chat helpers ────────────────────────────────────────────────────────────

  function addSystem(contactId: string, text: string) {
    setConvos(prev => ({
      ...prev,
      [contactId]: [
        ...(prev[contactId] ?? []),
        { id: `${Date.now()}${Math.random()}`, role: 'system', text, ts: Date.now() },
      ],
    }))
  }

  function addMessage(contactId: string, msg: Omit<ChatMessage, 'id' | 'ts'>) {
    setConvos(prev => ({
      ...prev,
      [contactId]: [
        ...(prev[contactId] ?? []),
        { ...msg, id: `${Date.now()}${Math.random()}`, ts: Date.now() },
      ],
    }))
    // Update last message on contact
    setContacts(prev => prev.map(c =>
      c.id === contactId
        ? { ...c, lastMessage: msg.text, lastTs: Date.now() }
        : c
    ))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selected || !user) return
    const text = input.trim()
    setInput('')
    setSending(true)

    addMessage(selected.id, { role: 'user', text })

    try {
      const res = await fetch(`${GATEWAY}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, to: selected.id, text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to send')
      // Subtle sent confirmation
      setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, lastMessage: text, lastTs: Date.now() } : c))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      toast.error(msg)
      addMessage(selected.id, { role: 'system', text: `Error: ${msg}` })
    } finally {
      setSending(false)
    }
  }

  // ── Contact management ──────────────────────────────────────────────────────

  function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!newPhone.trim()) return
    const rawPhone = newPhone.trim().replace(/\D/g, '')
    const jid      = `${rawPhone}@s.whatsapp.net`
    if (contacts.find(c => c.id === jid)) {
      toast.error('Contact already added')
      return
    }
    const contact: Contact = {
      id: jid,
      name: newName.trim() || rawPhone,
      phone: rawPhone,
      aiEnabled: false,
    }
    setContacts(prev => [...prev, contact])
    setNewPhone('')
    setNewName('')
    setShowAddContact(false)
    setSelected(contact)
    toast.success('Contact added')
  }

  function handleUpdateContact(id: string, patch: Partial<Contact>) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : prev)
  }

  function handleDeleteContact(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

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

  const isConnected   = status === 'connected'
  const connectBusy   = status === 'loading' || status === 'qr'
  const messages      = selected ? (convos[selected.id] ?? []) : (convos['__global__'] ?? [])
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone.includes(contactSearch)
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-slate-200 overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-[#020617] flex-shrink-0">
        <div className="p-2 bg-green-500/15 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-white tracking-tight">WhatsApp Gateway</h1>
          <p className="text-xs text-slate-500 font-mono">{GATEWAY}</p>
        </div>

        {/* Connection status pill */}
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
          isConnected
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          {isConnected ? `Connected · ${phone}` : 'Disconnected'}
        </div>

        {/* Global AI toggle */}
        <div className="flex items-center gap-2 border border-slate-700 rounded-full px-3 py-1">
          <Bot className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">AI</span>
          <button
            onClick={() => setGlobalAi(v => !v)}
            disabled={!isConnected}
            className={`relative w-8 h-4 rounded-full transition-colors disabled:opacity-40 ${globalAi ? 'bg-green-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${globalAi ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Main 3-col layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════ COL 1: Connection Panel ════ */}
        <aside className="w-72 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-y-auto bg-[#030712]">

          {/* Connect / Disconnect */}
          <div className="p-4 border-b border-slate-800">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={connectBusy}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
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
                className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Unplug className="w-4 h-4" /> Disconnect
              </button>
            )}
          </div>

          {/* QR Code */}
          {status === 'qr' && qrSrc && (
            <div className="p-4 border-b border-slate-800 flex flex-col items-center gap-3">
              <p className="text-slate-400 text-xs text-center font-mono">Scan with WhatsApp</p>
              <div className="bg-white p-3 rounded-xl">
                <img src={qrSrc} alt="WhatsApp QR Code" className="w-48 h-48 object-contain" />
              </div>
              <p className="text-slate-500 text-xs text-center leading-relaxed">
                WhatsApp &rarr; Settings &rarr; Linked Devices &rarr; Link a Device
              </p>
              <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Waiting for scan…
              </div>
            </div>
          )}

          {/* Webhook URL */}
          <div className="p-4 border-b border-slate-800">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Webhook</p>
            <div className="flex gap-1.5">
              <code className="flex-1 bg-[#020617] border border-slate-800 rounded-lg px-2 py-1.5 text-green-400 text-xs font-mono truncate">
                {webhookUrl}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                {copied
                  ? <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                  : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Activity log */}
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Activity Log</p>
            <div className="space-y-1.5">
              {(convos['__global__'] ?? []).map(m => (
                <p key={m.id} className="text-xs text-slate-500 font-mono leading-relaxed">
                  <span className="text-slate-600">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {' '}{m.text}
                </p>
              ))}
            </div>
          </div>
        </aside>

        {/* ════ COL 2: Contact List ════ */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-800 flex flex-col bg-[#020617]">
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <input
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts…"
                className="flex-1 bg-transparent text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowAddContact(v => !v)}
              className="p-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add contact form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/50">
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone number (e.g. 2348012345678)"
                className="w-full bg-[#020617] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40"
              />
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full bg-[#020617] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <User className="w-8 h-8 text-slate-700" />
                <p className="text-slate-600 text-xs">No contacts yet.<br />Click + to add a contact.</p>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => { setSelected(contact); setShowAiPanel(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-3 border-b border-slate-800/50 hover:bg-slate-900/60 transition-colors text-left ${
                    selected?.id === contact.id ? 'bg-slate-900/80 border-l-2 border-l-green-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-400">
                    {initials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200 truncate">{contact.name}</p>
                      {contact.aiEnabled && (
                        <Bot className="w-3 h-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {contact.lastMessage || contact.phone}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ════ COL 3: Chat + AI Settings ════ */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
              <img src="/cat-avatar.jpg" alt="Cat" className="w-16 h-16 rounded-full opacity-40 object-cover" />
              <p className="text-slate-500 text-sm">Select a contact to start chatting<br />or add a new one from the list.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-[#030712] flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                  {initials(selected.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{selected.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{phoneFromJid(selected.id)}</p>
                </div>

                {/* Per-contact AI toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">AI</span>
                  <button
                    onClick={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                    disabled={!isConnected}
                    className={`relative w-8 h-4 rounded-full transition-colors disabled:opacity-40 ${selected.aiEnabled ? 'bg-green-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${selected.aiEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>

                {/* AI settings button */}
                <button
                  onClick={() => setShowAiPanel(v => !v)}
                  className={`p-1.5 rounded-lg border transition-colors ${showAiPanel ? 'bg-green-600/20 border-green-600/30 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                {/* Delete contact */}
                <button
                  onClick={() => handleDeleteContact(selected.id)}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">

                {/* Messages area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-50">
                        <img src="/cat-avatar.jpg" alt="Cat" className="w-10 h-10 rounded-full object-cover" />
                        <p className="text-xs text-slate-500">No messages yet.<br />{isConnected ? 'Send a message to start.' : 'Connect WhatsApp first.'}</p>
                      </div>
                    )}

                    {messages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'bot' && (
                          <img src="/cat-avatar.jpg" alt="Cat" className="w-6 h-6 rounded-full object-cover self-end flex-shrink-0" />
                        )}
                        <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-green-600 text-white rounded-br-sm'
                            : msg.role === 'system'
                            ? 'bg-slate-800/60 text-slate-500 font-mono text-xs border border-slate-700/50 w-full rounded-lg'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}>
                          {msg.text}
                          {msg.role !== 'system' && (
                            <p className="text-[10px] opacity-40 mt-0.5 text-right">
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
                    className="flex items-center gap-2 px-4 py-3 border-t border-slate-800 bg-[#030712] flex-shrink-0"
                  >
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      disabled={!isConnected || sending}
                      placeholder={isConnected ? `Message ${selected.name}…` : 'Connect WhatsApp first…'}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!isConnected || !input.trim() || sending}
                      className="flex items-center justify-center w-9 h-9 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>

                {/* AI Settings panel (slide in) */}
                {showAiPanel && (
                  <div className="w-64 flex-shrink-0 border-l border-slate-800 bg-[#030712] overflow-y-auto p-4">
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-4">AI Settings · {selected.name}</p>

                    {/* AI enabled toggle */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">AI Replies</p>
                        <p className="text-xs text-slate-500">Auto-respond to this contact</p>
                      </div>
                      <button
                        onClick={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                        disabled={!isConnected}
                        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${selected.aiEnabled ? 'bg-green-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selected.aiEnabled ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>

                    {/* AI Personality */}
                    <div className="mb-4">
                      <label className="text-xs text-slate-500 font-mono block mb-1.5">Custom Personality</label>
                      <textarea
                        value={selected.aiPersonality || ''}
                        onChange={e => handleUpdateContact(selected.id, { aiPersonality: e.target.value })}
                        placeholder="e.g. Reply formally in English. Focus on product inquiries only."
                        rows={4}
                        className="w-full bg-[#020617] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 resize-none"
                      />
                    </div>

                    {/* AI Model */}
                    <div className="mb-4">
                      <label className="text-xs text-slate-500 font-mono block mb-1.5">AI Model</label>
                      <select
                        value={selected.aiModel || 'default'}
                        onChange={e => handleUpdateContact(selected.id, { aiModel: e.target.value })}
                        className="w-full bg-[#020617] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500/40"
                      >
                        <option value="default">Default (Business Config)</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="claude-opus-4.6">Claude Opus</option>
                        <option value="gemini-3-flash">Gemini Flash</option>
                      </select>
                    </div>

                    {selected.aiEnabled && (
                      <div className="flex items-center gap-2 p-2.5 bg-green-500/8 border border-green-500/20 rounded-lg">
                        <Bot className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-400">AI is active for this contact</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  )
}
