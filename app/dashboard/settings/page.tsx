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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_PERSONALITY =
  'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.'

type Tab = 'profile' | 'ai' | 'phone' | 'account'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'phone', label: 'Phone', icon: MessageSquare },
  { id: 'account', label: 'Account', icon: Shield },
]

type SaveState = 'idle' | 'saving' | 'saved'

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

export default function SettingsPage() {
  const { user, business, refreshBusiness } = useAuth()

  const [avatarUrl, setAvatarUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [aiPersonality, setAiPersonality] = useState(DEFAULT_PERSONALITY)
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o-mini')
  const [whatsappPhone, setWhatsappPhone] = useState('')

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [saveState, setSaveState] = useState<Record<Tab, SaveState>>({
    profile: 'idle', ai: 'idle', phone: 'idle', account: 'idle',
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
    if (!user) {
      toast.error('Not authenticated.')
      return
    }

    setSaveState((s) => ({ ...s, [tab]: 'saving' }))

    try {
      await updateBusiness(user.uid, data)
      // Re-fetch from server so all UI (including dashboard header) reflects the new values
      await refreshBusiness()
      setSaveState((s) => ({ ...s, [tab]: 'saved' }))
      toast.success('Saved successfully.')
      setTimeout(() => setSaveState((s) => ({ ...s, [tab]: 'idle' })), 2500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to save: ${errorMsg}`)
      setSaveState((s) => ({ ...s, [tab]: 'idle' }))
    }
  }

  return (
    <div className="min-h-full bg-background">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your business and AVA agent</p>
      </div>

      <div className="px-4 lg:px-8 pb-6">

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 mb-5 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center',
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

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[var(--aro-green)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Business Profile</h2>
                <p className="text-xs text-muted-foreground">Avatar and name shown on your dashboard</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save('profile', { avatarUrl, name: businessName.trim() }) }}>
              {/* Avatar */}
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
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    folder="avatars"
                    variant="square"
                    label="Upload logo"
                  />
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

              <div className="flex justify-end mt-5">
                <SaveButton state={saveState.profile} />
              </div>
            </form>
          </div>
        )}

        {/* ── AI tab ── */}
        {activeTab === 'ai' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-[var(--aro-green)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">AI Personality</h2>
                <p className="text-xs text-muted-foreground">System prompt and model for AVA</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save('ai', { aiPersonality: aiPersonality.trim(), openrouterModel: openrouterModel.trim() }) }}>
              <div className="flex flex-col gap-5">
                <FieldBlock
                  label="Model"
                  hint="OpenRouter model slug — e.g. openai/gpt-4o-mini, anthropic/claude-3-haiku"
                >
                  <Input
                    value={openrouterModel}
                    onChange={(e) => setOpenrouterModel(e.target.value)}
                    placeholder="openai/gpt-4o-mini"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono text-sm"
                  />
                </FieldBlock>

                <FieldBlock
                  label="System Prompt"
                  hint="Describes how AVA behaves with customers. Combined with your product catalogue at runtime."
                >
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

        {/* ── Phone tab ── */}
        {activeTab === 'phone' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-[var(--aro-green)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Link Phone Number</h2>
                <p className="text-xs text-muted-foreground">WhatsApp number customers message AVA on</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save('phone', { whatsappPhone: whatsappPhone.trim() }) }}>
              <div className="flex flex-col gap-5">
                <FieldBlock
                  label="WhatsApp Number"
                  hint="Include country code, e.g. +2348012345678. Customers message this number to reach AVA."
                >
                  <Input
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+2348012345678"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono"
                  />
                </FieldBlock>

                <div className="flex items-start gap-3 p-3.5 bg-[var(--aro-green)]/8 border border-[var(--aro-green)]/20 rounded-xl">
                  <MessageSquare className="w-4 h-4 text-[var(--aro-green)] mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Go to the WhatsApp page to connect your number via QR code.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <SaveButton state={saveState.phone} />
              </div>
            </form>
          </div>
        )}

        {/* ── Account tab ── */}
        {activeTab === 'account' && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-[var(--aro-green)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Account</h2>
                <p className="text-xs text-muted-foreground">Your login and platform credentials</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <ReadonlyField label="Email Address" value={user?.email ?? ''} />
              <ReadonlyField label="Account ID" value={user?.uid ?? ''} mono />

              {/* Plan badge */}
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
        )}

      </div>
    </div>
  )
}
