'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from '@/lib/firestore'
import type { Contact } from '@/lib/types'
import { toast } from 'sonner'
import {
  Copy,
  CheckCheck,
  Send,
  Loader2,
  SmartphoneNfc,
  Unplug,
  Bot,
  Settings2,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  X,
  ArrowLeft,
  Wifi,
  WifiOff,
  Activity,
  MessageSquare,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.onrender.com'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'bot' | 'system'
  text: string
  ts: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isConnectedData(d: unknown): boolean {
  if (!d || typeof d !== 'object') return false
  const data = d as Record<string, unknown>
  return (
    data.status === 'connected' ||
    data.status === 'CONNECTED' ||
    data.connected === true ||
    data.state === 'open' ||
    data.state === 'connected' ||
    data.isConnected === true
  )
}

function phoneFromJid(jid: string) {
  return jid.replace(/@.*/, '')
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-[var(--aro-green)]/20 text-[var(--aro-green)]',
    'bg-[var(--aro-teal)]/20 text-[var(--aro-teal)]',
    'bg-[var(--aro-green-light)]/20 text-[var(--aro-green-light)]',
    'bg-primary/20 text-primary',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ connected, phone }: { connected: boolean; phone: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
        connected
          ? 'bg-[var(--aro-green)]/10 border-[var(--aro-green)]/30 text-[var(--aro-green)]'
          : 'bg-muted border-border text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          connected ? 'bg-[var(--aro-green)] animate-pulse' : 'bg-muted-foreground',
        )}
      />
      {connected ? `Connected · ${phone}` : 'Disconnected'}
    </div>
  )
}

function ContactAvatar({ contact, size = 'md' }: { contact: Contact; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold shrink-0',
        sz,
        avatarColor(contact.name),
      )}
    >
      {initials(contact.name)}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { user } = useAuth()

  // ── Connection state ──
  const [status, setStatus] = useState<'idle' | 'loading' | 'qr' | 'connected'>('idle')
  const [qrSrc, setQrSrc] = useState('')
  const [phone, setPhone] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCheckedRef = useRef(false)
  const [initialising, setInitialising] = useState(false)

  // ── Webhook ──
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)

  // ── Contacts (Firestore-backed) ──
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [deletingContact, setDeletingContact] = useState<string | null>(null)

  // ── Chat ──
  const [convos, setConvos] = useState<Record<string, ChatMessage[]>>({})
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── AI settings panel ──
  const [showAiPanel, setShowAiPanel] = useState(false)

  // ── Global AI toggle ──
  const [globalAi, setGlobalAi] = useState(false)

  // ── Mobile nav view: 'connections' | 'contacts' | 'chat' ──
  const [mobileView, setMobileView] = useState<'connections' | 'contacts' | 'chat'>('connections')

  // ── Init ──
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)
  }, [])

  useEffect(() => {
    if (!user || hasCheckedRef.current) return
    hasCheckedRef.current = true
    checkExistingSession()
  }, [user])

  useEffect(() => {
    if (!user) return
    loadContacts()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convos, selected])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── Contacts Firestore ──────────────────────────────────────────────────────

  async function loadContacts() {
    if (!user) return
    setContactsLoading(true)
    try {
      const list = await getContacts(user.uid)
      setContacts(list)
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setContactsLoading(false)
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newPhone.trim()) return
    const rawPhone = newPhone.trim().replace(/\D/g, '')
    const jid = `${rawPhone}@s.whatsapp.net`
    if (contacts.find((c) => c.jid === jid)) {
      toast.error('Contact already exists')
      return
    }
    setAddingContact(true)
    try {
      const contact = await createContact(user.uid, {
        jid,
        phone: rawPhone,
        name: newName.trim() || rawPhone,
        aiEnabled: false,
      })
      setContacts((prev) => [contact, ...prev])
      setNewPhone('')
      setNewName('')
      setShowAddContact(false)
      setSelected(contact)
      setMobileView('chat')
      toast.success('Contact saved')
    } catch {
      toast.error('Failed to save contact')
    } finally {
      setAddingContact(false)
    }
  }

  async function handleUpdateContact(id: string, patch: Partial<Contact>) {
    if (!user) return
    try {
      await updateContact(user.uid, id, patch)
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
      if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, ...patch } : prev))
    } catch {
      toast.error('Failed to update contact')
    }
  }

  async function handleDeleteContact(id: string) {
    if (!user) return
    setDeletingContact(id)
    try {
      await deleteContact(user.uid, id)
      setContacts((prev) => prev.filter((c) => c.id !== id))
      if (selected?.id === id) {
        setSelected(null)
        setMobileView('contacts')
      }
      toast.success('Contact removed')
    } catch {
      toast.error('Failed to delete contact')
    } finally {
      setDeletingContact(null)
    }
  }

  // ── Session helpers ─────────────────────────────────────────────────────────

  async function checkExistingSession() {
    if (!user) return
    setInitialising(true)
    try {
      const res = await fetch(`${GATEWAY}/status/${user.uid}`)
      const data = await res.json()
      if (isConnectedData(data)) {
        const num = (data as Record<string, string>).phone || (data as Record<string, string>).phoneNumber || (data as Record<string, string>).number || 'Connected'
        setStatus('connected')
        setPhone(num)
        addSystem('__global__', `Session restored. Phone: ${num}`)
      }
    } catch {
      // Gateway offline — show idle
    } finally {
      setInitialising(false)
    }
  }

  async function handleConnect() {
    if (!user) return
    setStatus('loading')
    addSystem('__global__', 'Initiating session with gateway…')
    try {
      const res = await fetch(`${GATEWAY}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
      await res.json()

      const qrRes = await fetch(`${GATEWAY}/qr/${user.uid}`)
      const qrData = await qrRes.json() as Record<string, unknown>

      if (qrData.qr) {
        setQrSrc(qrData.qr as string)
        setStatus('qr')
        addSystem('__global__', 'QR code ready — scan with WhatsApp on your phone.')
      } else if (isConnectedData(qrData)) {
        const num = (qrData.phone as string) || (qrData.phoneNumber as string) || 'Connected'
        setStatus('connected')
        setPhone(num)
        addSystem('__global__', `Already connected. Phone: ${num}`)
        return
      } else {
        addSystem('__global__', 'No QR returned yet — retrying…')
        setStatus('idle')
        return
      }

      let attempts = 0
      let done = false
      pollRef.current = setInterval(async () => {
        if (done) return
        attempts++
        try {
          const sRes = await fetch(`${GATEWAY}/status/${user.uid}`)
          const sData = await sRes.json()
          if (isConnectedData(sData)) {
            done = true
            clearInterval(pollRef.current!)
            pollRef.current = null
            const num = (sData as Record<string, string>).phone || (sData as Record<string, string>).phoneNumber || (sData as Record<string, string>).number || 'Connected'
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

  // ── Chat helpers ─────────────────────────────────────────────────────────────

  function addSystem(contactId: string, text: string) {
    setConvos((prev) => ({
      ...prev,
      [contactId]: [
        ...(prev[contactId] ?? []),
        { id: `${Date.now()}${Math.random()}`, role: 'system', text, ts: Date.now() },
      ],
    }))
  }

  function addMessage(contactId: string, msg: Omit<ChatMessage, 'id' | 'ts'>) {
    setConvos((prev) => ({
      ...prev,
      [contactId]: [
        ...(prev[contactId] ?? []),
        { ...msg, id: `${Date.now()}${Math.random()}`, ts: Date.now() },
      ],
    }))
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, lastMessage: msg.text, lastTs: Date.now() } : c,
      ),
    )
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
        body: JSON.stringify({ userId: user.uid, to: selected.jid, text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data as Record<string, string>).error || (data as Record<string, string>).message || 'Failed to send')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      toast.error(msg)
      addMessage(selected.id, { role: 'system', text: `Error: ${msg}` })
    } finally {
      setSending(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isConnected = status === 'connected'
  const connectBusy = status === 'loading' || status === 'qr'
  const messages = selected ? (convos[selected.id] ?? []) : (convos['__global__'] ?? [])
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch),
  )

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <p className="text-muted-foreground">Please sign in</p>
    </div>
  )

  if (initialising) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 bg-background">
      <Loader2 className="w-6 h-6 text-[var(--aro-green)] animate-spin" />
      <p className="text-muted-foreground text-sm font-mono">Checking session…</p>
    </div>
  )

  // ── Panel: Connection + Activity ─────────────────────────────────────────────

  const ConnectionPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--aro-green)]/15 flex items-center justify-center">
          {isConnected
            ? <Wifi className="w-3.5 h-3.5 text-[var(--aro-green)]" />
            : <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
        <h2 className="text-sm font-semibold text-foreground">Connection</h2>
        <StatusPill connected={isConnected} phone={phone} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Connect / Disconnect button */}
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={connectBusy}
            className="w-full bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold rounded-xl"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
            ) : status === 'qr' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Waiting for scan…</>
            ) : (
              <><SmartphoneNfc className="w-4 h-4" /> Connect WhatsApp</>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <Unplug className="w-4 h-4" /> Disconnect
          </Button>
        )}

        {/* QR Code */}
        {status === 'qr' && qrSrc && (
          <div className="flex flex-col items-center gap-3 p-4 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground text-xs text-center">Scan with WhatsApp</p>
            <div className="bg-white p-3 rounded-xl">
              <img src={qrSrc} alt="WhatsApp QR Code" className="w-44 h-44 object-contain" />
            </div>
            <p className="text-muted-foreground text-xs text-center leading-relaxed">
              WhatsApp &rarr; Settings &rarr; Linked Devices &rarr; Link a Device
            </p>
            <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-mono">
              <Loader2 className="w-3 h-3 animate-spin" /> Waiting for scan…
            </div>
          </div>
        )}

        {/* Global AI toggle */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[var(--aro-green)]" />
            <div>
              <p className="text-sm font-medium text-foreground">Global AI</p>
              <p className="text-xs text-muted-foreground">Auto-reply all messages</p>
            </div>
          </div>
          <button
            onClick={() => setGlobalAi((v) => !v)}
            disabled={!isConnected}
            aria-label="Toggle global AI"
            className={cn(
              'relative w-9 h-5 rounded-full transition-colors disabled:opacity-40',
              globalAi ? 'bg-[var(--aro-green)]' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                globalAi ? 'translate-x-4' : '',
              )}
            />
          </button>
        </div>

        {/* Webhook URL */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Webhook URL</p>
          <div className="flex gap-1.5">
            <code className="flex-1 bg-card border border-border rounded-lg px-2.5 py-2 text-[var(--aro-green)] text-xs font-mono truncate">
              {webhookUrl}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 bg-card hover:bg-secondary border border-border rounded-lg transition-colors"
              aria-label="Copy webhook URL"
            >
              {copied
                ? <CheckCheck className="w-3.5 h-3.5 text-[var(--aro-green)]" />
                : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Activity log */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Activity</p>
          </div>
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-48">
            {(convos['__global__'] ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic">No activity yet</p>
            ) : (
              (convos['__global__'] ?? []).map((m) => (
                <p key={m.id} className="text-xs text-muted-foreground font-mono leading-relaxed">
                  <span className="opacity-50">
                    {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>{' '}
                  {m.text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Panel: Contact List ───────────────────────────────────────────────────────

  const ContactListPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-[var(--aro-green)]" />
          <h2 className="text-sm font-semibold text-foreground flex-1">Contacts</h2>
          <button
            onClick={() => setShowAddContact((v) => !v)}
            className="p-1.5 bg-[var(--aro-green)]/15 hover:bg-[var(--aro-green)]/25 border border-[var(--aro-green)]/25 text-[var(--aro-green)] rounded-lg transition-colors"
            aria-label="Add contact"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search contacts…"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Add contact form */}
      {showAddContact && (
        <form
          onSubmit={handleAddContact}
          className="p-3 border-b border-border space-y-2 bg-secondary/40 shrink-0"
        >
          <Input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone number e.g. 2348012345678"
            className="text-xs h-8 bg-background border-border"
            required
          />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Display name (optional)"
            className="text-xs h-8 bg-background border-border"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={addingContact}
              size="sm"
              className="flex-1 h-8 text-xs bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-lg"
            >
              {addingContact ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddContact(false)}
              className="flex-1 h-8 text-xs rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {contactsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-[var(--aro-green)] animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <Phone className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-xs">
              {contacts.length === 0 ? 'No contacts yet. Click + to add one.' : 'No contacts match your search.'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                setSelected(contact)
                setShowAiPanel(false)
                setMobileView('chat')
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 border-b border-border/50 hover:bg-secondary/60 transition-colors text-left',
                selected?.id === contact.id &&
                  'bg-[var(--aro-green)]/8 border-l-2 border-l-[var(--aro-green)]',
              )}
            >
              <ContactAvatar contact={contact} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                  {contact.aiEnabled && (
                    <Bot className="w-3 h-3 text-[var(--aro-green)] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {contact.lastMessage || `+${contact.phone}`}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )

  // ── Panel: Chat ────────────────────────────────────────────────────────────────

  const ChatPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {!selected ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/20 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-[var(--aro-green)]" />
          </div>
          <p className="text-foreground font-semibold text-sm">No conversation selected</p>
          <p className="text-muted-foreground text-xs">
            Select a contact to start chatting or add a new one.
          </p>
        </div>
      ) : (
        <>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            {/* Mobile back button */}
            <button
              onClick={() => setMobileView('contacts')}
              className="lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Back to contacts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <ContactAvatar contact={selected} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selected.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{phoneFromJid(selected.jid)}</p>
            </div>

            {/* Per-contact AI toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">AI</span>
              <button
                onClick={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                disabled={!isConnected}
                aria-label="Toggle AI for this contact"
                className={cn(
                  'relative w-8 h-4 rounded-full transition-colors disabled:opacity-40',
                  selected.aiEnabled ? 'bg-[var(--aro-green)]' : 'bg-border',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform',
                    selected.aiEnabled ? 'translate-x-4' : '',
                  )}
                />
              </button>
            </div>

            {/* AI settings */}
            <button
              onClick={() => setShowAiPanel((v) => !v)}
              aria-label="AI settings"
              className={cn(
                'p-1.5 rounded-lg border transition-colors',
                showAiPanel
                  ? 'bg-[var(--aro-green)]/15 border-[var(--aro-green)]/25 text-[var(--aro-green)]'
                  : 'bg-card border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDeleteContact(selected.id)}
              disabled={deletingContact === selected.id}
              aria-label="Delete contact"
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              {deletingContact === selected.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-60">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      No messages yet.{' '}
                      {isConnected ? 'Send a message to start.' : 'Connect WhatsApp first.'}
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-[var(--aro-green)] text-[var(--aro-bg)] rounded-br-sm'
                          : msg.role === 'system'
                          ? 'bg-secondary text-muted-foreground font-mono text-xs border border-border w-full rounded-xl'
                          : 'bg-card text-foreground border border-border rounded-bl-sm',
                      )}
                    >
                      {msg.text}
                      {msg.role !== 'system' && (
                        <p className="text-[10px] opacity-50 mt-0.5 text-right">
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
                className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card shrink-0"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!isConnected || sending}
                  placeholder={
                    isConnected ? `Message ${selected.name}…` : 'Connect WhatsApp first…'
                  }
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--aro-green)]/30 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!isConnected || !input.trim() || sending}
                  className="flex items-center justify-center w-9 h-9 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] disabled:opacity-40 text-[var(--aro-bg)] rounded-xl transition-colors shrink-0"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>

            {/* AI Settings side panel */}
            {showAiPanel && (
              <div className="w-64 shrink-0 border-l border-border bg-card overflow-y-auto hidden lg:block">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                      AI Settings
                    </p>
                    <button
                      onClick={() => setShowAiPanel(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* AI enabled */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">AI Replies</p>
                      <p className="text-xs text-muted-foreground">Auto-respond to this contact</p>
                    </div>
                    <button
                      onClick={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                      disabled={!isConnected}
                      aria-label="Toggle AI replies"
                      className={cn(
                        'relative w-10 h-5 rounded-full transition-colors disabled:opacity-40',
                        selected.aiEnabled ? 'bg-[var(--aro-green)]' : 'bg-border',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                          selected.aiEnabled ? 'translate-x-5' : '',
                        )}
                      />
                    </button>
                  </div>

                  {/* Personality */}
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground font-mono block mb-1.5">
                      Custom Personality
                    </label>
                    <textarea
                      value={selected.aiPersonality || ''}
                      onChange={(e) => handleUpdateContact(selected.id, { aiPersonality: e.target.value })}
                      placeholder="e.g. Reply formally in English. Focus on product inquiries only."
                      rows={4}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--aro-green)]/30 resize-none transition-colors"
                    />
                  </div>

                  {/* Model */}
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground font-mono block mb-1.5">
                      AI Model
                    </label>
                    <select
                      value={selected.aiModel || 'default'}
                      onChange={(e) => handleUpdateContact(selected.id, { aiModel: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--aro-green)]/30"
                    >
                      <option value="default">Default (Business Config)</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="claude-opus-4.6">Claude Opus</option>
                      <option value="gemini-3-flash">Gemini Flash</option>
                    </select>
                  </div>

                  {selected.aiEnabled && (
                    <div className="flex items-center gap-2 p-2.5 bg-[var(--aro-green)]/8 border border-[var(--aro-green)]/20 rounded-lg">
                      <Bot className="w-4 h-4 text-[var(--aro-green)] shrink-0" />
                      <p className="text-xs text-[var(--aro-green)]">AI is active for this contact</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-0px)] lg:h-screen flex flex-col bg-background overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        {/* Mobile: show back button if in contacts or chat */}
        {mobileView !== 'connections' && (
          <button
            onClick={() =>
              setMobileView(mobileView === 'chat' ? 'contacts' : 'connections')
            }
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* WhatsApp icon */}
        <div className="p-2 bg-[var(--aro-green)]/10 rounded-xl shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[var(--aro-green)]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground tracking-tight">WhatsApp Gateway</h1>
          <p className="text-xs text-muted-foreground font-mono truncate hidden sm:block">{GATEWAY}</p>
        </div>

        <StatusPill connected={isConnected} phone={phone} />

        {/* Mobile tab switcher */}
        <div className="flex items-center lg:hidden gap-0.5 bg-secondary rounded-lg p-0.5 border border-border">
          {(['connections', 'contacts', 'chat'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setMobileView(view)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all capitalize',
                mobileView === view
                  ? 'bg-[var(--aro-green)] text-[var(--aro-bg)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {view === 'connections' ? 'Link' : view === 'contacts' ? 'Chats' : 'Chat'}
            </button>
          ))}
        </div>
      </header>

      {/* ── 3-column layout (desktop) / single panel (mobile) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* COL 1: Connection panel */}
        <aside
          className={cn(
            'w-72 shrink-0 border-r border-border bg-background',
            'lg:flex flex-col',
            mobileView === 'connections' ? 'flex flex-col w-full' : 'hidden',
          )}
        >
          {ConnectionPanel}
        </aside>

        {/* COL 2: Contact list */}
        <aside
          className={cn(
            'w-64 shrink-0 border-r border-border bg-background',
            'lg:flex flex-col',
            mobileView === 'contacts' ? 'flex flex-col w-full' : 'hidden',
          )}
        >
          {ContactListPanel}
        </aside>

        {/* COL 3: Chat */}
        <main
          className={cn(
            'flex-1 min-w-0 bg-background',
            'lg:flex flex-col',
            mobileView === 'chat' ? 'flex flex-col w-full' : 'hidden',
          )}
        >
          {ChatPanel}
        </main>
      </div>
    </div>
  )
}
