'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings, Bot, Building2, RotateCcw } from 'lucide-react'

const DEFAULT_PERSONALITY =
  'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.'

export default function SettingsPage() {
  const { user, business, loading } = useAuth()
  const [businessName, setBusinessName] = useState(business?.name ?? '')
  const [aiPersonality, setAiPersonality] = useState(business?.aiPersonality ?? DEFAULT_PERSONALITY)
  const [saving, setSaving] = useState(false)

  // Keep form in sync with real-time business data
  if (business) {
    if (businessName !== business.name && !saving) {
      setBusinessName(business.name)
    }
    if (aiPersonality !== business.aiPersonality && !saving) {
      setAiPersonality(business.aiPersonality)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await updateBusiness(user.uid, {
        name: businessName.trim(),
        aiPersonality: aiPersonality.trim(),
      })
      toast.success('Settings saved.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl h-40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8892a4] text-sm mt-1">Configure your AVA sales agent</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Business info */}
        <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-[#6C5CE7]" />
            <h2 className="text-white font-semibold">Business Info</h2>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#f0f4ff] text-sm">Business Name</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
              required
              className="bg-[#1a2235] border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] h-11"
            />
            <p className="text-[#8892a4] text-xs mt-1">
              AVA will use this name when introducing itself to customers.
            </p>
          </div>
        </div>

        {/* AI Personality */}
        <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#6C5CE7]" />
              <h2 className="text-white font-semibold">AI Personality</h2>
            </div>
            <button
              type="button"
              onClick={() => setAiPersonality(DEFAULT_PERSONALITY)}
              className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-[#6C5CE7] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to default
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[#f0f4ff] text-sm">System Prompt</Label>
            <textarea
              value={aiPersonality}
              onChange={(e) => setAiPersonality(e.target.value)}
              rows={8}
              placeholder="Describe how AVA should behave..."
              className="bg-[#1a2235] border border-[#6C5CE7]/25 text-white placeholder:text-[#8892a4] rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] leading-relaxed"
            />
            <p className="text-[#8892a4] text-xs mt-1">
              This is the base persona for AVA. It is combined with your product catalogue when responding to customers. Be specific about tone, language, and negotiation behaviour.
            </p>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-4 h-4 text-[#6C5CE7]" />
            <h2 className="text-white font-semibold">Account</h2>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#f0f4ff] text-sm">Email</Label>
            <Input
              value={user?.email ?? ''}
              disabled
              className="bg-[#0B0F1A] border-[#6C5CE7]/15 text-[#8892a4] h-11 cursor-not-allowed"
            />
            <p className="text-[#8892a4] text-xs mt-1">
              Your email address cannot be changed here.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-xl h-11 font-semibold transition-all"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}
