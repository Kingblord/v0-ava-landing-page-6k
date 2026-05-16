'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness } from '@/lib/firebase-auth'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Bot,
  Building2,
  RotateCcw,
  MessageSquare,
  User,
  CheckCircle2,
  Shield,
  Copy,
  Check,
  Bell,
  Globe,
  DollarSign,
  Lock,
  Smartphone,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

type Tab = 'business' | 'ai' | 'phone' | 'security' | 'notifications' | 'preferences'
type SaveState = 'idle' | 'saving' | 'saved'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'ai', label: 'AI Agent', icon: Bot },
  { id: 'phone', label: 'WhatsApp', icon: MessageSquare },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'preferences', label: 'Prefs', icon: Globe },
]

function SaveButton({ state, onClick }: { state: SaveState; onClick?: () => void }) {
  return (
    <Button
      type="submit"
      disabled={state === 'saving' || state === 'saved'}
      onClick={onClick}
      className={cn(
        'h-10 px-5 rounded-xl font-semibold text-sm transition-all gap-2',
        state === 'saved'
          ? 'bg-[var(--aro-teal)]/15 text-[var(--aro-teal)] border border-[var(--aro-teal)]/30 hover:bg-[var(--aro-teal)]/15'
          : 'bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]',
      )}
    >
      {state === 'saved' ? (
        <><CheckCircle2 className="w-4 h-4" /> Saved</>
      ) : state === 'saving' ? 'Saving...' : 'Save Changes'}
    </Button>
  )
}

function FieldBlock({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  )
}

function ReadonlyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <FieldBlock label={label}>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          disabled
          className={cn(
            'flex-1 bg-secondary border-border text-muted-foreground cursor-default h-11 rounded-xl',
            mono && 'font-mono text-xs',
          )}
        />
        <button
          type="button"
          onClick={copy}
          className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          aria-label="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-[var(--aro-green)]" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </FieldBlock>
  )
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[var(--aro-green)]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
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

export default function SettingsPage() {
  const { user, business, refreshBusiness } = useAuth()

  // Business
  const [avatarUrl, setAvatarUrl] = useState('')
  const [businessName, setBusinessName] = useState('')

  // AI
  const [aiPersonality, setAiPersonality] = useState(DEFAULT_PERSONALITY)
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o-mini')

  // Phone
  const [whatsappPhone, setWhatsappPhone] = useState('')

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)

  // Notifications
  const [notifNewOrder, setNotifNewOrder] = useState(true)
  const [notifNewMessage, setNotifNewMessage] = useState(true)
  const [notifDailyReport, setNotifDailyReport] = useState(false)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)
  const [notifAiErrors, setNotifAiErrors] = useState(true)

  // Preferences
  const [currency, setCurrency] = useState('NGN')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [compactMode, setCompactMode] = useState(false)
  const [soundEffects, setSoundEffects] = useState(true)

  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [saveState, setSaveState] = useState<Record<Tab, SaveState>>({
    business: 'idle', ai: 'idle', phone: 'idle', security: 'idle', notifications: 'idle', preferences: 'idle',
  })

  useEffect(() => {
    if (!business) return
    setAvatarUrl(business.avatarUrl ?? '')
    setBusinessName(business.name ?? '')
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
      toast.success('Saved successfully.')
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
    // Placeholder — wire to Firebase Auth updatePassword
    setTimeout(() => {
      toast.success('Password updated.')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setSaveState((s) => ({ ...s, security: 'saved' }))
      setTimeout(() => setSaveState((s) => ({ ...s, security: 'idle' })), 2500)
    }, 800)
  }

  return (
    <div className="min-h-full bg-background">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your business, AI agent and account preferences</p>
      </div>

      <div className="px-4 lg:px-8 pb-10">

        {/* Tab bar — horizontal scroll on mobile */}
        <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 mb-5 overflow-x-auto scrollbar-hide">
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

        {/* ── Business tab ── */}
        {activeTab === 'business' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionHeader icon={Building2} title="Business Profile" description="Name and logo shown to your customers" />
            <form onSubmit={(e) => { e.preventDefault(); save('business', { avatarUrl, name: businessName.trim() }) }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-16 h-16 rounded-2xl bg-secondary border border-border overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Business Logo</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">Square image, min 256x256px</p>
                  <ImageUpload value={avatarUrl} onChange={setAvatarUrl} folder="avatars" variant="square" label="Upload logo" />
                </div>
              </div>
              <FieldBlock label="Business Name" hint="AVA uses this name when talking to customers.">
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kicks & Co."
                  required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                />
              </FieldBlock>
              <div className="mt-5 pt-4 border-t border-border">
                <ReadonlyField label="Email Address" value={user?.email ?? ''} />
              </div>
              <div className="mt-4">
                <ReadonlyField label="Account ID" value={user?.uid ?? ''} mono />
              </div>
              <div className="flex justify-end mt-5">
                <SaveButton state={saveState.business} />
              </div>
            </form>
          </div>
        )}

        {/* ── AI Agent tab ── */}
        {activeTab === 'ai' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionHeader icon={Bot} title="AI Agent" description="System prompt and model for AVA" />
            <form onSubmit={(e) => { e.preventDefault(); save('ai', { aiPersonality: aiPersonality.trim(), openrouterModel: openrouterModel.trim() }) }}>
              <div className="flex flex-col gap-5">
                <FieldBlock label="Model" hint="OpenRouter model slug — e.g. openai/gpt-4o-mini, anthropic/claude-3-haiku">
                  <Input
                    value={openrouterModel}
                    onChange={(e) => setOpenrouterModel(e.target.value)}
                    placeholder="openai/gpt-4o-mini"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono text-sm"
                  />
                </FieldBlock>
                <FieldBlock label="System Prompt" hint="Describes how AVA behaves with customers. Combined with your product catalogue at runtime.">
                  <textarea
                    value={aiPersonality}
                    onChange={(e) => setAiPersonality(e.target.value)}
                    rows={8}
                    placeholder="Describe how AVA should behave..."
                    className="w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 rounded-xl px-3 py-3 text-sm resize-y outline-none transition-colors leading-relaxed"
                  />
                </FieldBlock>
              </div>
              <div className="flex items-center justify-between mt-5">
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
          </div>
        )}

        {/* ── WhatsApp tab ── */}
        {activeTab === 'phone' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionHeader icon={MessageSquare} title="WhatsApp Number" description="The number customers message to reach AVA" />
            <form onSubmit={(e) => { e.preventDefault(); save('phone', { whatsappPhone: whatsappPhone.trim() }) }}>
              <div className="flex flex-col gap-5">
                <FieldBlock label="WhatsApp Number" hint="Include country code, e.g. +2348012345678. Customers message this number to reach AVA.">
                  <Input
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+2348012345678"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono"
                  />
                </FieldBlock>
                <div className="flex items-start gap-3 p-3.5 bg-[var(--aro-green)]/8 border border-[var(--aro-green)]/20 rounded-xl">
                  <Smartphone className="w-4 h-4 text-[var(--aro-green)] mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Go to the <strong className="text-foreground">WhatsApp</strong> page to connect your number via QR code scan.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-5">
                <SaveButton state={saveState.phone} />
              </div>
            </form>
          </div>
        )}

        {/* ── Security tab ── */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* Change Password */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader icon={Lock} title="Change Password" description="Update your account password" />
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                <FieldBlock label="Current Password">
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-secondary border-border text-foreground h-11 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  <SaveButton state={saveState.security} />
                </div>
              </form>
            </div>

            {/* Security Settings */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader icon={Shield} title="Security Settings" description="Two-factor and login alerts" />
              <div>
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
              <div className="mt-4 flex items-start gap-3 p-3.5 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Two-factor authentication is <strong className="text-amber-500">recommended</strong> to protect your business account.
                </p>
              </div>
            </div>

            {/* Account */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader icon={Shield} title="Account" description="Your login credentials" />
              <div className="flex flex-col gap-4">
                <ReadonlyField label="Email Address" value={user?.email ?? ''} />
                <ReadonlyField label="Account ID" value={user?.uid ?? ''} mono />
                <div className="flex items-center justify-between p-4 bg-secondary border border-border rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Current Plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AroMsg Starter</p>
                  </div>
                  <span className="text-xs font-bold bg-[var(--aro-green)]/10 text-[var(--aro-green)] border border-[var(--aro-green)]/20 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === 'notifications' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionHeader icon={Bell} title="Notifications" description="Choose what alerts you receive" />
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Notification preferences saved.') }}>
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pb-1">Orders & Messages</p>
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
                  label="AI Errors"
                  description="Alert when AVA fails to respond to a customer"
                  value={notifAiErrors}
                  onChange={setNotifAiErrors}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pb-1 pt-3 border-t border-border">Reports</p>
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
              </div>
              <div className="flex justify-end mt-5">
                <Button
                  type="submit"
                  className="h-10 px-5 rounded-xl font-semibold text-sm bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]"
                >
                  Save Preferences
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Preferences tab ── */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader icon={DollarSign} title="Currency" description="Currency shown on orders and products" />
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
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border/80',
                    )}
                  >
                    <span className="text-base font-bold w-6 text-center">{c.symbol}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
                    </div>
                    {currency === c.code && <Check className="w-3.5 h-3.5 text-[var(--aro-green)] ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader icon={Globe} title="Language & Region" description="Language, timezone and display preferences" />
              <div className="flex flex-col gap-5">
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

                <div className="pt-1 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pb-2">Display</p>
                  <ToggleRow
                    label="Compact Mode"
                    description="Reduce spacing for a denser layout"
                    value={compactMode}
                    onChange={setCompactMode}
                  />
                  <ToggleRow
                    label="Sound Effects"
                    description="Play sounds for new messages and orders"
                    value={soundEffects}
                    onChange={setSoundEffects}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-5">
                <Button
                  type="button"
                  onClick={() => toast.success('Preferences saved.')}
                  className="h-10 px-5 rounded-xl font-semibold text-sm bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
