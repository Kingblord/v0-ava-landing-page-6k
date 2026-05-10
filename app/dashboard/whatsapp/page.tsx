'use client'

import { useEffect, useRef, useState } from 'react'
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
  X,
  ArrowLeft,
  Wifi,
  WifiOff,
  Activity,
  MessageSquare,
  Phone,
  Link2,
  ChevronRight,
  Zap,
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

function avatarColor(name: string): string {
  const palettes = [
    'bg-emerald-500/20 text-emerald-400',
    'bg-teal-500/20 text-teal-400',
    'bg-green-500/20 text-green-400',
    'bg-cyan-500/20 text-cyan-400',
  ]
  return palettes[name.charCodeAt(0) % palettes.length]
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Status Light ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'idle' | 'loading' | 'qr' | 'connected' }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full shrink-0',
        status === 'connected'
          ? 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)] animate-pulse'
          : status === 'loading' || status === 'qr'
          ? 'bg-yellow-400 shadow-[0_0_6px_2px_rgba(250,204,21,0.5)] animate-pulse'
          : 'bg-red-500 shadow-[0_0_4px_1px_rgba(239,68,68,0.4)]',
      )}
    />
  )
}

// ─── Contact Avatar ───────────────────────────────────────────────────────────

function ContactAvatar({ contact, size = 'md' }: { contact: Contact; size?: 'sm' | 'md' | 'lg' }) {
  const sz =
    size === 'lg' ? 'w-12 h-12 text-sm' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-xs'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold shrink-0', sz, avatarColor(contact.name))}>
      {initials(contact.name)}
    </div>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40',
        checked ? 'bg-[var(--aro-green)]' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Bottom Sheet ────────────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border-t border-border rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-hide">{children}</div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { user } = useAuth()

  // ── Connection ──
  const [status, setStatus] = useState<'idle' | 'loading' | 'qr' | 'connected'>('idle')
  const [qrSrc, setQrSrc] = useState('')
  const [phone, setPhone] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCheckedRef = useRef(false)
  const [initialising, setInitialising] = useState(true)

  // ── Webhook ──
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)

  // ── Contacts ──
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

  // ── AI ──
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [globalAi, setGlobalAi] = useState(false)

  // ── Mobile state ──
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts')
  const [showConnectionSheet, setShowConnectionSheet] = useState(false)
  const [showAiSheet, setShowAiSheet] = useState(false)

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

  // ── Contacts ──────────────────────────────────────────────────────────────────

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
      setShowConnectionSheet(false)
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
        setShowAiSheet(false)
      }
      toast.success('Contact removed')
    } catch {
      toast.error('Failed to delete contact')
    } finally {
      setDeletingContact(null)
    }
  }

  // ── Gateway helpers ───────────────────────────────────────────────────────────

  async function checkExistingSession() {
    if (!user) return
    setInitialising(true)
    try {
      const res = await fetch(`${GATEWAY}/status/${user.uid}`)
      const data = await res.json() as { connected: boolean; phoneNumber?: string | null }
      if (data.connected === true) {
        const num = data.phoneNumber || 'Connected'
        setStatus('connected')
        setPhone(num)
      }
    } catch {
      // Gateway offline
    } finally {
      setInitialising(false)
    }
  }

  async function handleConnect() {
    if (!user) return
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setQrSrc('')
    setStatus('loading')
    addSystem('__global__', 'Initiating session…')

    try {
      await fetch(`${GATEWAY}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      let qrAttempts = 0
      let statusAttempts = 0
      let done = false
      let qrShowing = false
      let lastQr = ''

      pollRef.current = setInterval(async () => {
        if (done) return
        try {
          if (!qrShowing) {
            qrAttempts++
            const qrRes = await fetch(`${GATEWAY}/qr/${user.uid}`)
            const qrData = await qrRes.json() as { qr?: string | null; connected: boolean }
            if (qrData.connected === true) {
              done = true
              clearInterval(pollRef.current!); pollRef.current = null
              const sRes = await fetch(`${GATEWAY}/status/${user.uid}`)
              const sData = await sRes.json() as { connected: boolean; phoneNumber?: string | null }
              const num = sData.phoneNumber || 'Connected'
              setStatus('connected'); setPhone(num); setQrSrc('')
              addSystem('__global__', `Connected — ${num}`)
              toast.success('WhatsApp connected!')
              return
            }
            if (qrData.qr) {
              lastQr = qrData.qr
              setQrSrc(qrData.qr)
              setStatus('qr')
              qrShowing = true
              addSystem('__global__', 'QR ready — scan with WhatsApp.')
            } else if (qrAttempts >= 20) {
              done = true
              clearInterval(pollRef.current!); pollRef.current = null
              addSystem('__global__', 'No QR returned. Check your gateway server.')
              setStatus('idle')
            }
          } else {
            statusAttempts++
            if (statusAttempts % 3 === 0) {
              const freshQr = await fetch(`${GATEWAY}/qr/${user.uid}`)
              const freshQrData = await freshQr.json() as { qr?: string | null; connected: boolean }
              if (freshQrData.qr && freshQrData.qr !== lastQr) {
                lastQr = freshQrData.qr
                setQrSrc(freshQrData.qr)
              }
            }
            const sRes = await fetch(`${GATEWAY}/status/${user.uid}`)
            const sData = await sRes.json() as { connected: boolean; phoneNumber?: string | null }
            if (sData.connected === true) {
              done = true
              clearInterval(pollRef.current!); pollRef.current = null
              const num = sData.phoneNumber || 'Connected'
              setStatus('connected'); setPhone(num); setQrSrc('')
              addSystem('__global__', `Connected — ${num}`)
              toast.success('WhatsApp connected!')
            } else if (statusAttempts >= 90) {
              done = true
              clearInterval(pollRef.current!); pollRef.current = null
              addSystem('__global__', 'Timed out. Please try again.')
              setStatus('idle'); setQrSrc('')
            }
          }
        } catch { /* keep polling */ }
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
    setStatus('idle'); setQrSrc(''); setPhone('')
    addSystem('__global__', 'Disconnected.')
    toast.info('Disconnected from WhatsApp')
  }

  // ── Chat ──────────────────────────────────────────────────────────────────────

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
      if (!res.ok) throw new Error((data as Record<string, string>).error || 'Failed to send')
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

  // ── Derived ───────────────────────────────────────────────────────────────────

  const isConnected = status === 'connected'
  const connectBusy = status === 'loading' || status === 'qr'
  const messages = selected ? (convos[selected.id] ?? []) : []
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch),
  )
  const activityLog = convos['__global__'] ?? []

  // ── Loading splash ────────────────────────────────────────────────────────────

  if (!user || initialising) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-112px)] lg:h-screen gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[var(--aro-green)] animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">Connecting to gateway…</p>
      </div>
    )
  }

  // ── AI Settings content (shared between desktop panel and mobile sheet) ───────

  const AiSettingsContent = selected ? (
    <div className="p-5 space-y-5">
      {/* AI toggle row */}
      <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-[var(--aro-green)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Replies</p>
            <p className="text-xs text-muted-foreground">Auto-respond to this contact</p>
          </div>
        </div>
        <Toggle
          checked={selected.aiEnabled}
          onChange={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
          disabled={!isConnected}
        />
      </div>

      {selected.aiEnabled && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--aro-green)]/8 border border-[var(--aro-green)]/20 rounded-xl">
          <Zap className="w-3.5 h-3.5 text-[var(--aro-green)] shrink-0" />
          <p className="text-xs text-[var(--aro-green)] font-medium">AI is active for this contact</p>
        </div>
      )}

      {/* Personality */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Custom Personality
        </label>
        <textarea
          value={selected.aiPersonality || ''}
          onChange={(e) => handleUpdateContact(selected.id, { aiPersonality: e.target.value })}
          placeholder="e.g. Reply formally in English. Focus on product inquiries only."
          rows={4}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--aro-green)]/40 resize-none transition-colors"
        />
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          AI Model
        </label>
        <select
          value={selected.aiModel || 'default'}
          onChange={(e) => handleUpdateContact(selected.id, { aiModel: e.target.value })}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--aro-green)]/40"
        >
          <option value="default">Default (Business Config)</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="claude-opus-4.6">Claude Opus</option>
          <option value="gemini-3-flash">Gemini Flash</option>
        </select>
      </div>
    </div>
  ) : null

  // ── Connection panel content ────────────────────────────────────────────────

  const ConnectionContent = (
    <div className="p-5 space-y-4">

      {/* Status card */}
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-2xl border',
        isConnected
          ? 'bg-emerald-500/8 border-emerald-500/20'
          : connectBusy
          ? 'bg-yellow-500/8 border-yellow-500/20'
          : 'bg-secondary border-border',
      )}>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          isConnected ? 'bg-emerald-500/15' : connectBusy ? 'bg-yellow-500/15' : 'bg-secondary',
        )}>
          {isConnected
            ? <Wifi className="w-5 h-5 text-emerald-400" />
            : connectBusy
            ? <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
            : <WifiOff className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <p className={cn(
              'text-sm font-semibold',
              isConnected ? 'text-emerald-400' : connectBusy ? 'text-yellow-400' : 'text-foreground',
            )}>
              {isConnected ? 'Connected' : connectBusy ? 'Connecting…' : 'Disconnected'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
            {isConnected ? phone : GATEWAY.replace('https://', '')}
          </p>
        </div>
      </div>

      {/* Action button */}
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={connectBusy}
          className="w-full h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] font-semibold rounded-2xl"
        >
          {connectBusy ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {status === 'qr' ? 'Waiting for scan…' : 'Connecting…'}</>
          ) : (
            <><SmartphoneNfc className="w-4 h-4" /> Connect WhatsApp</>
          )}
        </Button>
      ) : (
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/8 hover:border-destructive/50 rounded-2xl font-semibold"
        >
          <Unplug className="w-4 h-4" /> Disconnect
        </Button>
      )}

      {/* QR Code */}
      {status === 'qr' && qrSrc && (
        <div className="flex flex-col items-center gap-4 p-5 bg-card border border-border rounded-2xl">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <img src={qrSrc} alt="WhatsApp QR Code" className="w-48 h-48 object-contain" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Scan to link</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              WhatsApp &rarr; Settings &rarr; Linked Devices &rarr; Link a Device
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
            <Loader2 className="w-3 h-3 animate-spin" /> Waiting for scan…
          </div>
        </div>
      )}

      {/* Global AI */}
      <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-[var(--aro-green)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Global AI</p>
            <p className="text-xs text-muted-foreground">Auto-reply all messages</p>
          </div>
        </div>
        <Toggle
          checked={globalAi}
          onChange={() => setGlobalAi((v) => !v)}
          disabled={!isConnected}
        />
      </div>

      {/* Webhook */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Webhook URL</p>
        <div className="flex gap-2">
          <code className="flex-1 min-w-0 bg-secondary border border-border rounded-xl px-3 py-2.5 text-[var(--aro-green)] text-xs font-mono truncate">
            {webhookUrl}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-10 h-10 bg-secondary hover:bg-card border border-border rounded-xl transition-colors shrink-0"
            aria-label="Copy webhook URL"
          >
            {copied
              ? <CheckCheck className="w-4 h-4 text-[var(--aro-green)]" />
              : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Activity log */}
      {activityLog.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Activity</p>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
            {activityLog.map((m) => (
              <p key={m.id} className="text-xs text-muted-foreground font-mono leading-relaxed">
                <span className="opacity-50">{fmtTime(m.ts)}</span> {m.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] lg:h-screen bg-background overflow-hidden">

      {/* ── Page header (inside page content area) ── */}
      <div className="shrink-0 px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-4 flex items-center gap-3">
        {/* Mobile back in chat view */}
        {mobileView === 'chat' && (
          <button
            onClick={() => setMobileView('contacts')}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors -ml-1"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {mobileView !== 'chat' && (
          <>
            <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[var(--aro-green)]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground tracking-tight">WhatsApp</h1>
                <StatusDot status={status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {isConnected ? phone : 'Not connected'}
              </p>
            </div>
          </>
        )}

        {/* Mobile: connection sheet trigger */}
        <button
          onClick={() => setShowConnectionSheet(true)}
          className={cn(
            'lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0 ml-auto',
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : connectBusy
              ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
              : 'bg-secondary border-border text-muted-foreground',
          )}
        >
          <StatusDot status={status} />
          {isConnected ? 'Linked' : connectBusy ? 'Linking' : 'Link'}
        </button>
      </div>

      {/* ── Body: 3-col desktop / 1-panel mobile ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* COL 1: Connection — desktop only */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 border-r border-border overflow-y-auto scrollbar-hide">
          {ConnectionContent}
        </aside>

        {/* COL 2: Contacts */}
        <aside
          className={cn(
            'border-r border-border flex flex-col overflow-hidden',
            'lg:w-72 lg:shrink-0 lg:flex',
            mobileView === 'contacts' ? 'flex flex-col w-full' : 'hidden',
          )}
        >
          {/* Contacts header */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-foreground flex-1">Contacts</p>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                {contacts.length}
              </span>
              <button
                onClick={() => setShowAddContact((v) => !v)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-xl border transition-all',
                  showAddContact
                    ? 'bg-[var(--aro-green)] border-[var(--aro-green)] text-[var(--aro-bg)]'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
                )}
                aria-label="Add contact"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2.5 bg-secondary border border-border rounded-xl px-3 py-2.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Add contact form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="px-4 py-3 border-b border-border bg-secondary/30 space-y-2.5 shrink-0">
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone e.g. 2348012345678"
                className="h-10 bg-background border-border text-sm rounded-xl"
                required
              />
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (optional)"
                className="h-10 bg-background border-border text-sm rounded-xl"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addingContact}
                  size="sm"
                  className="flex-1 h-9 text-xs bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-xl font-semibold"
                >
                  {addingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Contact'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddContact(false)}
                  className="h-9 px-3 text-xs rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {contactsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-[var(--aro-green)] animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                  <Phone className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {contacts.length === 0 ? 'No contacts yet' : 'No matches'}
                </p>
                {contacts.length === 0 && (
                  <p className="text-xs text-muted-foreground/70">Tap + to add your first contact</p>
                )}
              </div>
            ) : (
              <div>
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelected(contact)
                      setShowAiPanel(false)
                      setMobileView('chat')
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/50 text-left transition-all duration-150',
                      selected?.id === contact.id
                        ? 'bg-[var(--aro-green)]/8 border-l-2 border-l-[var(--aro-green)]'
                        : 'hover:bg-secondary/60',
                    )}
                  >
                    <div className="relative shrink-0">
                      <ContactAvatar contact={contact} size="md" />
                      {contact.aiEnabled && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--aro-green)] rounded-full flex items-center justify-center border-2 border-background">
                          <Bot className="w-2 h-2 text-[var(--aro-bg)]" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
                        {contact.lastTs && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {fmtTime(contact.lastTs)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.lastMessage || `+${contact.phone}`}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* COL 3: Chat */}
        <main
          className={cn(
            'flex-1 min-w-0 bg-background flex flex-col overflow-hidden',
            'lg:flex',
            mobileView === 'chat' ? 'flex' : 'hidden',
          )}
        >
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/15 flex items-center justify-center">
                <MessageSquare className="w-9 h-9 text-[var(--aro-green)]/60" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-1">No conversation open</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a contact from the list to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
                <button
                  onClick={() => setMobileView('contacts')}
                  className="lg:hidden p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <ContactAvatar contact={selected} size="md" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">+{phoneFromJid(selected.jid)}</p>
                </div>

                {/* AI quick toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">AI</span>
                  <Toggle
                    checked={selected.aiEnabled}
                    onChange={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                    disabled={!isConnected}
                  />
                </div>

                {/* AI settings */}
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setShowAiSheet((v) => !v)
                    } else {
                      setShowAiPanel((v) => !v)
                    }
                  }}
                  aria-label="AI settings"
                  className={cn(
                    'p-2 rounded-xl border transition-colors',
                    showAiPanel || showAiSheet
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
                  className="p-2 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  {deletingContact === selected.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-60">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {isConnected ? 'Send a message to start' : 'Connect WhatsApp first'}
                        </p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      >
                        {msg.role === 'system' ? (
                          <div className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-xs text-muted-foreground font-mono text-center">
                            {msg.text}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                              msg.role === 'user'
                                ? 'bg-[var(--aro-green)] text-[var(--aro-bg)] rounded-br-sm'
                                : 'bg-card text-foreground border border-border rounded-bl-sm',
                            )}
                          >
                            <p>{msg.text}</p>
                            <p className="text-[10px] opacity-50 mt-0.5 text-right">{fmtTime(msg.ts)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input bar */}
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2.5 px-4 py-3 border-t border-border bg-card shrink-0"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={!isConnected || sending}
                      placeholder={isConnected ? `Message ${selected.name}…` : 'Connect WhatsApp first…'}
                      className="flex-1 bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--aro-green)]/30 disabled:opacity-50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!isConnected || !input.trim() || sending}
                      className="flex items-center justify-center w-10 h-10 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] disabled:opacity-40 text-[var(--aro-bg)] rounded-2xl transition-colors shrink-0"
                      aria-label="Send"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>

                {/* Desktop AI panel */}
                {showAiPanel && (
                  <div className="hidden lg:flex flex-col w-64 shrink-0 border-l border-border overflow-y-auto scrollbar-hide">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-[var(--aro-green)]" />
                        <p className="text-sm font-semibold text-foreground">AI Settings</p>
                      </div>
                      <button onClick={() => setShowAiPanel(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {AiSettingsContent}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Mobile: Connection Sheet ── */}
      <BottomSheet
        open={showConnectionSheet}
        onClose={() => setShowConnectionSheet(false)}
        title={
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <span>Connection</span>
          </div>
        }
      >
        {ConnectionContent}
      </BottomSheet>

      {/* ── Mobile: AI Settings Sheet ── */}
      <BottomSheet
        open={showAiSheet && !!selected}
        onClose={() => setShowAiSheet(false)}
        title={
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[var(--aro-green)]" />
            <span>AI — {selected?.name}</span>
          </div>
        }
      >
        {AiSettingsContent}
      </BottomSheet>
    </div>
  )
}
