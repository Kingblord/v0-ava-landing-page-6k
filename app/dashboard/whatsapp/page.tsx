'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getBusiness, updateBusiness } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  MessageSquare,
  Copy,
  CheckCheck,
  ExternalLink,
  Wifi,
  WifiOff,
  Smartphone,
  BookOpen,
  Zap,
} from 'lucide-react'

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [savedPhone, setSavedPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '/api/whatsapp/webhook'

  useEffect(() => {
    if (!user) return
    getBusiness(user.uid).then((b) => {
      if (b?.whatsappPhone) {
        setWhatsappPhone(b.whatsappPhone)
        setSavedPhone(b.whatsappPhone)
      }
    }).finally(() => setLoading(false))
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await updateBusiness(user.uid, { whatsappPhone: whatsappPhone.trim() })
      setSavedPhone(whatsappPhone.trim())
      toast.success('WhatsApp number saved.')
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isConnected = !!savedPhone

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">WhatsApp Setup</h1>
        <p className="text-[#8892a4] text-sm mt-1">Connect your WhatsApp to activate the AVA sales agent</p>
      </div>

      {/* Connection status */}
      <div
        className={`flex items-center gap-4 p-4 rounded-2xl border mb-6 ${
          isConnected
            ? 'bg-[#00D1B2]/8 border-[#00D1B2]/20'
            : 'bg-[#1a2235] border-[#6C5CE7]/15'
        }`}
      >
        {isConnected ? (
          <Wifi className="w-6 h-6 text-[#00D1B2] shrink-0" />
        ) : (
          <WifiOff className="w-6 h-6 text-[#8892a4] shrink-0" />
        )}
        <div>
          <p className={`font-semibold text-sm ${isConnected ? 'text-[#00D1B2]' : 'text-[#8892a4]'}`}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </p>
          <p className="text-[#8892a4] text-xs mt-0.5">
            {isConnected ? `Receiving messages on ${savedPhone}` : 'Add your Twilio WhatsApp number below'}
          </p>
        </div>
        {isConnected && (
          <div className="ml-auto flex items-center gap-2 bg-[#00D1B2]/10 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse" />
            <span className="text-[#00D1B2] text-xs font-medium">Live</span>
            <Zap className="w-3 h-3 text-[#00D1B2]" />
          </div>
        )}
      </div>

      {/* Webhook URL */}
      <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-4 h-4 text-[#6C5CE7]" />
          <h2 className="text-white font-semibold">Webhook URL</h2>
        </div>
        <p className="text-[#8892a4] text-sm mb-4">
          Paste this URL into your{' '}
          <a
            href="https://console.twilio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6C5CE7] hover:text-[#8b7cf0] underline"
          >
            Twilio WhatsApp Sandbox
          </a>{' '}
          under &quot;When a message comes in&quot;.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-[#0B0F1A] border border-[#6C5CE7]/20 rounded-xl px-4 py-3 text-[#00D1B2] text-sm font-mono truncate">
            {webhookUrl}
          </code>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="shrink-0 border-[#6C5CE7]/25 text-[#8892a4] hover:text-white hover:bg-[#1a2235] rounded-xl gap-2"
          >
            {copied ? (
              <>
                <CheckCheck className="w-4 h-4 text-[#00D1B2]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Phone number */}
      <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-[#6C5CE7]" />
          <h2 className="text-white font-semibold">Your Twilio WhatsApp Number</h2>
        </div>
        <p className="text-[#8892a4] text-sm mb-4">
          Enter the Twilio number assigned to your WhatsApp sandbox (e.g. <code className="text-[#8b7cf0]">whatsapp:+14155238886</code>).
          AVA uses this to route incoming messages to your account.
        </p>
        <form onSubmit={handleSave} className="flex gap-3">
          <div className="flex-1">
            {loading ? (
              <div className="h-11 bg-[#1a2235] rounded-xl animate-pulse" />
            ) : (
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="whatsapp:+14155238886"
                className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] h-11 font-mono"
              />
            )}
          </div>
          <Button
            type="submit"
            disabled={saving || loading}
            className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl shrink-0"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </div>

      {/* Setup guide */}
      <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#6C5CE7]" />
          <h2 className="text-white font-semibold">Setup Guide</h2>
        </div>
        <ol className="space-y-3">
          {[
            'Create a free account at twilio.com and activate the WhatsApp Sandbox.',
            'Copy the webhook URL above and paste it into the "When a message comes in" field in your Twilio sandbox settings. Set the method to HTTP POST.',
            'Save your Twilio sandbox number in the field above.',
            'Add at least one product on the Products page so AVA knows what to sell.',
            'Send a message to the sandbox number from any WhatsApp account — AVA will respond.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6C5CE7]/15 border border-[#6C5CE7]/25 flex items-center justify-center text-[#6C5CE7] text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-[#8892a4] text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
