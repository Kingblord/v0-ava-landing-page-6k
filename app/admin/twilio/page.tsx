'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Section = 'twilio'

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
        active ? 'border-[#25D366]/50' : 'border-[#25D366]/15',
      )}
      onFocus={() => onFocus(id)}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#25D366]" />
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
        className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60 pr-10"
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

function SaveButton({ section, isSaving, isSaved }: { section: Section; isSaving: boolean; isSaved: boolean }) {
  return (
    <Button
      type="submit"
      disabled={isSaving || isSaved}
      className={cn(
        'text-white rounded-xl h-9 px-5 text-sm font-medium transition-all gap-2',
        isSaved ? 'bg-emerald-600/60 hover:bg-emerald-600/60' : 'bg-[#25D366] hover:bg-[#7970e6]',
      )}
    >
      {isSaved && <CheckCircle2 className="w-4 h-4" />}
      {isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
    </Button>
  )
}

export default function AdminTwilioPage() {
  const { user, business, loading: authLoading } = useAuth()
  const [twilioAccountSid, setTwilioAccountSid] = useState('')
  const [twilioAuthToken, setTwilioAuthToken] = useState('')
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync real-time business data
  useEffect(() => {
    if (!business) return
    setTwilioAccountSid(business.twilioAccountSid ?? '')
    setTwilioAuthToken(business.twilioAuthToken ?? '')
    setTwilioWhatsappNumber(business.twilioWhatsappNumber ?? '')
  }, [business])

  if (authLoading) {
    return <div className="p-8 text-center text-[#8892a4]">Loading...</div>
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">Not authenticated.</div>
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateBusiness(user.uid, {
        twilioAccountSid: twilioAccountSid.trim(),
        twilioAuthToken: twilioAuthToken.trim(),
        twilioWhatsappNumber: twilioWhatsappNumber.trim(),
      })
      setSaved(true)
      toast.success('Twilio settings saved.')
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Failed to save Twilio settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Twilio Configuration</h1>
          <p className="text-[#8892a4] text-sm">Manage WhatsApp integration credentials</p>
        </div>

        <form onSubmit={handleSave}>
          <SectionCard
            id="twilio"
            icon={Settings}
            title="Twilio WhatsApp Credentials"
            description="Admin-only settings for routing messages through Twilio"
            active={true}
            onFocus={() => {}}
          >
            <div className="flex flex-col gap-4 mb-4">
              <p className="text-[#8892a4] text-xs">
                These credentials route all WhatsApp messages through Twilio. Get them from your{' '}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:underline"
                >
                  Twilio Console
                </a>.
              </p>

              <div className="h-px bg-[#25D366]/10" />

              <FieldRow label="Twilio Account SID" hint="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
                <SecretInput
                  value={twilioAccountSid}
                  onChange={setTwilioAccountSid}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  id="account-sid"
                />
              </FieldRow>

              <FieldRow label="Twilio Auth Token" hint="Your authentication token">
                <SecretInput
                  value={twilioAuthToken}
                  onChange={setTwilioAuthToken}
                  placeholder="Your auth token"
                  id="auth-token"
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
                  className="bg-[#0d1120] border-[#25D366]/20 text-white placeholder:text-[#4a5568] focus:border-[#25D366]/60"
                />
              </FieldRow>
            </div>

            <div className="flex justify-end">
              <SaveButton section="twilio" isSaving={saving} isSaved={saved} />
            </div>
          </SectionCard>
        </form>

        <div className="bg-[#111827] border border-[#25D366]/15 rounded-2xl p-6">
          <h3 className="text-white font-semibold text-sm mb-3">How It Works</h3>
          <ul className="space-y-2 text-[#8892a4] text-xs">
            <li>• Users link their phone number in Dashboard Settings → Link Phone Number</li>
            <li>• Customers message that number on WhatsApp</li>
            <li>• Twilio receives the message via webhook and forwards it to AVA</li>
            <li>• AVA responds intelligently based on your products and AI personality</li>
            <li>• Only admins can configure these Twilio credentials</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
