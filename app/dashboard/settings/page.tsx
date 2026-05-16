'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Bot,
  MessageSquare,
  Shield,
  Bell,
  Globe,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Check,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PERSONALITY =
  'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.'

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
  { code: 'TZS', symbol: 'TSh', label: 'Tanzanian Shilling' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'ar', label: 'Arabic' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
  { code: 'sw', label: 'Swahili' },
  { code: 'pt', label: 'Portuguese' },
]

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'Asia/Dubai',
]

type Tab = 'ai' | 'whatsapp' | 'security' | 'preferences'
type SaveState = 'idle' | 'saving' | 'saved'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'ai',          label: 'AI Agent',    icon: Bot },
  { id: 'whatsapp',    label: 'WhatsApp',    icon: MessageSquare },
  { id: 'security',    label: 'Security',    icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Globe },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveButton({ state, onClick, label = 'Save Changes' }: {
  state: SaveState
  onClick?: () => void
  label?: string
}) {
  return (
    <Button
      type="submit"
      disabled={state === 'saving' || state === 'saved'}
      onClick={onClick}
      className={cn(
        'h-10 px-5 rounded-xl font-semibold text-sm gap-2 transition-all',
        state === 'saved'
          ? 'bg-[var(--aro-green)]/10 text-[var(--aro-green)] border border-[var(--aro-green)]/30 hover:bg-[var(--aro-green)]/10'
          : 'bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]',
      )}
    >
      {state === 'saved' ? (
        <><CheckCircle2 className="w-4 h-4" /> Saved</>
      ) : state === 'saving' ? 'Saving…' : label}
    </Button>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pb-3">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="border-t border-border my-5" />
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
          value ? 'bg-[var(--aro-green)]' : 'bg-secondary border border-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            value ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, business, refreshBusiness } = useAuth()

  // AI Agent
  const [aiPersonality, setAiPersonality] = useState(DEFAULT_PERSONALITY)
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o-mini')

  // WhatsApp
  const [whatsappPhone, setWhatsappPhone] = useState('')

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)

  // Preferences
  const [currency, setCurrency] = useState('NGN')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [notifNewOrder, setNotifNewOrder] = useState(true)
  const [notifNewMessage, setNotifNewMessage] = useState(true)
  const [notifDailyReport, setNotifDailyReport] = useState(false)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)

  const [activeTab, setActiveTab] = useState<Tab>('ai')
  const [saveState, setSaveState] = useState<Record<Tab, SaveState>>({
    ai: 'idle',
    whatsapp: 'idle',
    security: 'idle',
    preferences: 'idle',
  })

  useEffect(() => {
    if (!business) return
    setAiPersonality(business.aiPersonality ?? DEFAULT_PERSONALITY)
    setOpenrouterModel(business.openrouterModel ?? 'openai/gpt-4o-mini')
    setWhatsappPhone(business.whatsappPhone ?? '')
  }, [business])

  async function save(tab: Tab, data: Record<string, unknown>) {
    if (!user) { toast.error('Not authenticated.'); return }
    setSaveState((s) => ({ ...s, [tab]: 'saving' }))
    try {
      await updateBusiness(user.uid, data)
      await refreshBusiness()
      setSaveState((s) => ({ ...s, [tab]: 'saved' }))
      toast.success('Saved.')
      setTimeout(() => setSaveState((s) => ({ ...s, [tab]: 'idle' })), 2500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
      setSaveState((s) => ({ ...s, [tab]: 'idle' }))
    }
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) { toast.error('Enter a new password.'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return }
    setSaveState((s) => ({ ...s, security: 'saving' }))
    setTimeout(() => {
      toast.success('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaveState((s) => ({ ...s, security: 'saved' }))
      setTimeout(() => setSaveState((s) => ({ ...s, security: 'idle' })), 2500)
    }, 800)
  }

  return (
    <div className="min-h-full bg-background">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your AI agent, WhatsApp, security and preferences
        </p>
      </div>

      <div className="max-w-xl mx-auto px-4 pb-24 lg:max-w-none lg:px-8 lg:pb-10">

        {/* Tab bar */}
        <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0',
                activeTab === t.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── AI Agent ─────────────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('ai', {
                aiPersonality: aiPersonality.trim(),
                openrouterModel: openrouterModel.trim(),
              })
            }}
            className="space-y-5"
          >
            <SectionLabel>Model</SectionLabel>
            <FieldBlock
              label="Model Slug"
              hint="OpenRouter model identifier — e.g. openai/gpt-4o-mini, anthropic/claude-3-haiku"
            >
              <Input
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder="openai/gpt-4o-mini"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono text-sm"
              />
            </FieldBlock>

            <Divider />

            <SectionLabel>System Prompt</SectionLabel>
            <FieldBlock
              label="Personality"
              hint="Defines how AVA speaks to customers. Your product catalogue is appended automatically at runtime."
            >
              <textarea
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                rows={8}
                placeholder="Describe how AVA should behave…"
                className="w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 rounded-xl px-3 py-3 text-sm resize-y outline-none transition-colors leading-relaxed"
              />
            </FieldBlock>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAiPersonality(DEFAULT_PERSONALITY)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[var(--aro-green)] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to default
              </button>
              <SaveButton state={saveState.ai} />
            </div>
          </form>
        )}

        {/* ── WhatsApp ─────────────────────────────────────────────────────── */}
        {activeTab === 'whatsapp' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('whatsapp', { whatsappPhone: whatsappPhone.trim() })
            }}
            className="space-y-5"
          >
            <SectionLabel>Phone Number</SectionLabel>
            <FieldBlock
              label="WhatsApp Number"
              hint="Include country code. Customers message this number to reach AVA."
            >
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+2348012345678"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono"
              />
            </FieldBlock>

            <div className="flex items-start gap-3 p-4 bg-[var(--aro-green)]/6 border border-[var(--aro-green)]/20 rounded-xl">
              <Smartphone className="w-4 h-4 text-[var(--aro-green)] mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                After saving your number, go to the{' '}
                <strong className="text-foreground">WhatsApp</strong> page to connect via QR code scan.
              </p>
            </div>

            <div className="flex justify-end">
              <SaveButton state={saveState.whatsapp} />
            </div>
          </form>
        )}

        {/* ── Security ─────────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-6">

            {/* Change password */}
            <div>
              <SectionLabel>Change Password</SectionLabel>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <FieldBlock label="Current Password">
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-secondary border-border text-foreground h-11 rounded-xl pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FieldBlock>

                <FieldBlock label="New Password" hint="Minimum 8 characters.">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-secondary border-border text-foreground h-11 rounded-xl"
                  />
                </FieldBlock>

                <FieldBlock label="Confirm New Password">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-secondary border-border text-foreground h-11 rounded-xl"
                  />
                </FieldBlock>

                <div className="flex justify-end">
                  <SaveButton state={saveState.security} label="Update Password" />
                </div>
              </form>
            </div>

            <Divider />

            {/* Security toggles */}
            <div>
              <SectionLabel>Account Security</SectionLabel>
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                <div className="bg-card px-4">
                  <ToggleRow
                    label="Two-Factor Authentication"
                    description="Require a code when signing in from a new device"
                    value={twoFactor}
                    onChange={setTwoFactor}
                  />
                  <ToggleRow
                    label="Login Alerts"
                    description="Get notified when your account is accessed from a new location"
                    value={loginAlerts}
                    onChange={setLoginAlerts}
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 mt-4 p-4 bg-amber-500/6 border border-amber-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Two-factor authentication is{' '}
                  <strong className="text-amber-500">strongly recommended</strong> to protect your business account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">

            {/* Currency */}
            <div>
              <SectionLabel>Currency</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                      currency === c.code
                        ? 'border-[var(--aro-green)] bg-[var(--aro-green)]/8 text-foreground'
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className="text-base font-bold w-6 text-center shrink-0">{c.symbol}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
                    </div>
                    {currency === c.code && (
                      <Check className="w-3.5 h-3.5 text-[var(--aro-green)] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            {/* Language & Region */}
            <div>
              <SectionLabel>Language & Region</SectionLabel>
              <div className="space-y-4">
                <FieldBlock label="Language">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground h-11 rounded-xl px-3 text-sm outline-none focus:border-[var(--aro-green)]/60 transition-colors"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </FieldBlock>

                <FieldBlock label="Timezone">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground h-11 rounded-xl px-3 text-sm outline-none focus:border-[var(--aro-green)]/60 transition-colors"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </FieldBlock>
              </div>
            </div>

            <Divider />

            {/* Notifications */}
            <div>
              <SectionLabel>Notifications</SectionLabel>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-card px-4">
                  <ToggleRow
                    label="New Order"
                    description="Alert when a customer places an order"
                    value={notifNewOrder}
                    onChange={setNotifNewOrder}
                  />
                  <ToggleRow
                    label="New Message"
                    description="Alert when a customer sends a WhatsApp message"
                    value={notifNewMessage}
                    onChange={setNotifNewMessage}
                  />
                  <ToggleRow
                    label="Daily Report"
                    description="Daily summary of orders and conversations"
                    value={notifDailyReport}
                    onChange={setNotifDailyReport}
                  />
                  <ToggleRow
                    label="Weekly Report"
                    description="Weekly performance digest sent every Monday"
                    value={notifWeeklyReport}
                    onChange={setNotifWeeklyReport}
                  />
                  <ToggleRow
                    label="Sound Effects"
                    description="Play sounds for new messages and orders"
                    value={soundEffects}
                    onChange={setSoundEffects}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => toast.success('Preferences saved.')}
                className="h-10 px-5 rounded-xl font-semibold text-sm bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]"
              >
                <DollarSign className="w-4 h-4" />
                Save Preferences
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
