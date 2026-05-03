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
  Settings,
  Bot,
  Building2,
  RotateCcw,
  MessageSquare,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_PERSONALITY =
  'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.'

type Section = 'profile' | 'business' | 'ai' | 'whatsapp' | 'account'

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  children,
  active,
  onFocus,
}: {
  id: Section
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  active: boolean
  onFocus: (id: Section) => void
}) {
  return (
    <div
      className={cn(
        'bg-[#111827] border rounded-2xl p-6 transition-all duration-200',
        active ? 'border-[#6C5CE7]/50' : 'border-[#6C5CE7]/15',
      )}
      onFocus={() => onFocus(id)}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-[#6C5CE7]/15 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#6C5CE7]" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          <p className="text-[#8892a4] text-xs">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#c9d1e0] text-xs font-medium uppercase tracking-wider">{label}</Label>
      {children}
      {hint && <p className="text-[#8892a4] text-xs">{hint}</p>}
    </div>
  )
}

function SecretInput({ value, onChange, placeholder, id }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-white transition-colors"
        aria-label={show ? 'Hide' : 'Show'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { user, business } = useAuth()

  // Profile
  const [avatarUrl, setAvatarUrl] = useState('')

  // Business
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')

  // AI
  const [aiPersonality, setAiPersonality] = useState(DEFAULT_PERSONALITY)
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o-mini')

  // WhatsApp / Twilio
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [twilioAccountSid, setTwilioAccountSid] = useState('')
  const [twilioAuthToken, setTwilioAuthToken] = useState('')
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState('')

  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [saving, setSaving] = useState<Section | null>(null)
  const [saved, setSaved] = useState<Section | null>(null)

  // Sync real-time business data into local state
  useEffect(() => {
    if (!business) return
    setAvatarUrl(business.avatarUrl ?? '')
    setBusinessName(business.name ?? '')
    setEmail(business.email ?? '')
    setAiPersonality(business.aiPersonality ?? DEFAULT_PERSONALITY)
    setOpenrouterModel(business.openrouterModel ?? 'openai/gpt-4o-mini')
    setWhatsappPhone(business.whatsappPhone ?? '')
    setTwilioAccountSid(business.twilioAccountSid ?? '')
    setTwilioAuthToken(business.twilioAuthToken ?? '')
    setTwilioWhatsappNumber(business.twilioWhatsappNumber ?? '')
  }, [business])

  async function save(section: Section, data: Record<string, unknown>) {
    if (!user) return
    setSaving(section)
    try {
      await updateBusiness(user.uid, data)
      setSaved(section)
      toast.success('Saved.')
      setTimeout(() => setSaved(null), 2500)
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  function SaveButton({ section }: { section: Section }) {
    const isSaving = saving === section
    const isSaved = saved === section
    return (
      <Button
        type="submit"
        disabled={isSaving || isSaved}
        className={cn(
          'text-white rounded-xl h-9 px-5 text-sm font-medium transition-all gap-2',
          isSaved
            ? 'bg-[#00D1B2]/20 text-[#00D1B2] border border-[#00D1B2]/30 hover:bg-[#00D1B2]/20'
            : 'bg-[#6C5CE7] hover:bg-[#5548c7]',
        )}
      >
        {isSaved ? (
          <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
        ) : isSaving ? 'Saving...' : 'Save'}
      </Button>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8892a4] text-sm mt-1">
          Configure your business, AVA agent, and WhatsApp integration
        </p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Profile / Avatar ────────────────────────────── */}
        <SectionCard
          id="profile"
          icon={User}
          title="Profile"
          description="Business avatar shown on your dashboard"
          active={activeSection === 'profile'}
          onFocus={setActiveSection}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('profile', { avatarUrl })
            }}
          >
            <div className="flex items-center gap-6 mb-4">
              {/* Current avatar preview */}
              <div className="relative w-20 h-20 rounded-full bg-[#1a2235] border-2 border-[#6C5CE7]/25 overflow-hidden shrink-0">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-8 h-8 text-[#6C5CE7]/40" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-white text-sm font-medium">Business Avatar</p>
                <p className="text-[#8892a4] text-xs">
                  Upload a logo or icon. Recommended: square image, at least 256&times;256px.
                </p>
                <ImageUpload
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  folder="avatars"
                  variant="square"
                  label="Upload avatar"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <SaveButton section="profile" />
            </div>
          </form>
        </SectionCard>

        {/* ── Business Info ────────────────────────────────── */}
        <SectionCard
          id="business"
          icon={Building2}
          title="Business Info"
          description="Name and contact details AVA uses when talking to customers"
          active={activeSection === 'business'}
          onFocus={setActiveSection}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('business', { name: businessName.trim() })
            }}
          >
            <div className="flex flex-col gap-4 mb-4">
              <FieldRow
                label="Business Name"
                hint="AVA will introduce itself using this name."
              >
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kicks & Co."
                  required
                  className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60"
                />
              </FieldRow>
              <FieldRow label="Account Email">
                <Input
                  value={user?.email ?? ''}
                  disabled
                  className="bg-[#0d1120] border-[#6C5CE7]/10 text-[#8892a4] cursor-not-allowed"
                />
              </FieldRow>
            </div>
            <div className="flex justify-end">
              <SaveButton section="business" />
            </div>
          </form>
        </SectionCard>

        {/* ── AI Personality ───────────────────────────────── */}
        <SectionCard
          id="ai"
          icon={Bot}
          title="AI Personality"
          description="System prompt and model that controls AVA's behaviour"
          active={activeSection === 'ai'}
          onFocus={setActiveSection}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('ai', {
                aiPersonality: aiPersonality.trim(),
                openrouterModel: openrouterModel.trim(),
              })
            }}
          >
            <div className="flex flex-col gap-4 mb-4">
              <FieldRow
                label="Model"
                hint="OpenRouter model slug. e.g. openai/gpt-4o-mini, anthropic/claude-3-haiku"
              >
                <Input
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  placeholder="openai/gpt-4o-mini"
                  className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60"
                />
              </FieldRow>
              <FieldRow
                label="System Prompt"
                hint="This is the base persona for AVA, combined with your product catalogue when replying to customers."
              >
                <div className="relative">
                  <textarea
                    value={aiPersonality}
                    onChange={(e) => setAiPersonality(e.target.value)}
                    rows={7}
                    placeholder="Describe how AVA should behave..."
                    className="w-full bg-[#0d1120] border border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60 rounded-xl px-3 py-2.5 text-sm resize-y outline-none transition-colors leading-relaxed"
                  />
                </div>
              </FieldRow>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAiPersonality(DEFAULT_PERSONALITY)}
                className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-[#6C5CE7] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to default
              </button>
              <SaveButton section="ai" />
            </div>
          </form>
        </SectionCard>

        {/* ── WhatsApp / Twilio ────────────────────────────── */}
        <SectionCard
          id="whatsapp"
          icon={MessageSquare}
          title="WhatsApp & Twilio"
          description="Credentials used by AVA to send and receive WhatsApp messages"
          active={activeSection === 'whatsapp'}
          onFocus={setActiveSection}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('whatsapp', {
                whatsappPhone: whatsappPhone.trim(),
                twilioAccountSid: twilioAccountSid.trim(),
                twilioAuthToken: twilioAuthToken.trim(),
                twilioWhatsappNumber: twilioWhatsappNumber.trim(),
              })
            }}
          >
            <div className="flex flex-col gap-4 mb-4">
              <FieldRow
                label="Your WhatsApp Number"
                hint="The number customers will message. Include country code, e.g. +1234567890"
              >
                <Input
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60"
                />
              </FieldRow>

              <div className="h-px bg-[#6C5CE7]/10" />
              <p className="text-[#8892a4] text-xs">
                Twilio credentials are required to route messages through AVA. Find these in your{' '}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6C5CE7] hover:underline"
                >
                  Twilio Console
                </a>.
              </p>

              <FieldRow label="Twilio Account SID">
                <SecretInput
                  value={twilioAccountSid}
                  onChange={setTwilioAccountSid}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </FieldRow>
              <FieldRow label="Twilio Auth Token">
                <SecretInput
                  value={twilioAuthToken}
                  onChange={setTwilioAuthToken}
                  placeholder="Your auth token"
                />
              </FieldRow>
              <FieldRow
                label="Twilio WhatsApp Number"
                hint="The Twilio sender number, e.g. whatsapp:+14155238886"
              >
                <Input
                  value={twilioWhatsappNumber}
                  onChange={(e) => setTwilioWhatsappNumber(e.target.value)}
                  placeholder="whatsapp:+14155238886"
                  className="bg-[#0d1120] border-[#6C5CE7]/20 text-white placeholder:text-[#4a5568] focus:border-[#6C5CE7]/60"
                />
              </FieldRow>
            </div>
            <div className="flex justify-end">
              <SaveButton section="whatsapp" />
            </div>
          </form>
        </SectionCard>

        {/* ── Account ─────────────────────────────────────── */}
        <SectionCard
          id="account"
          icon={Settings}
          title="Account"
          description="Your login and plan details"
          active={activeSection === 'account'}
          onFocus={setActiveSection}
        >
          <div className="flex flex-col gap-4">
            <FieldRow label="Email Address">
              <Input
                value={user?.email ?? ''}
                disabled
                className="bg-[#0d1120] border-[#6C5CE7]/10 text-[#8892a4] cursor-not-allowed"
              />
            </FieldRow>
            <FieldRow label="Account ID">
              <Input
                value={user?.uid ?? ''}
                disabled
                className="bg-[#0d1120] border-[#6C5CE7]/10 text-[#8892a4] cursor-not-allowed font-mono text-xs"
              />
            </FieldRow>
          </div>
        </SectionCard>

      </div>
    </div>
  )
}
