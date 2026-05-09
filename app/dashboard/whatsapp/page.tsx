'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Copy,
  CheckCheck,
  ExternalLink,
  Wifi,
  BookOpen,
  Zap,
} from 'lucide-react'

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '/api/whatsapp/webhook'

  useEffect(() => {
    setLoading(false)
  }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">WhatsApp Integration</h1>
        <p className="text-[#8892a4] text-sm mt-1">Connect your WhatsApp via aromsg gateway</p>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border bg-[#00D1B2]/8 border-[#00D1B2]/20 mb-6">
        <Wifi className="w-6 h-6 text-[#00D1B2] shrink-0" />
        <div>
          <p className="font-semibold text-sm text-[#00D1B2]">Ready to Connect</p>
          <p className="text-[#8892a4] text-xs mt-0.5">Webhook is active and waiting for messages</p>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-4 h-4 text-[#6C5CE7]" />
          <h2 className="text-white font-semibold">Webhook URL</h2>
        </div>
        <p className="text-[#8892a4] text-sm mb-4">
          Configure this URL in your aromsg gateway to receive incoming messages and send AI responses.
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

      {/* Setup guide */}
      <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#6C5CE7]" />
          <h2 className="text-white font-semibold">Setup Guide</h2>
        </div>
        <ol className="space-y-3">
          {[
            'Copy the webhook URL above',
            'Go to aromsg.render.com and log in to your gateway account',
            'In your gateway settings, paste the webhook URL in the message forwarding configuration',
            'Add at least one product on the Products page so AI knows what to sell',
            'Send a message from WhatsApp - the AI will respond automatically',
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

      {/* How it works */}
      <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#6C5CE7]" />
          <h2 className="text-white font-semibold">How It Works</h2>
        </div>
        <div className="space-y-2 text-[#8892a4] text-sm">
          <p>✓ User sends message via WhatsApp</p>
          <p>✓ aromsg gateway receives message and forwards to your webhook</p>
          <p>✓ Our AI system processes the message and generates a response</p>
          <p>✓ Response is sent back to aromsg gateway</p>
          <p>✓ Gateway sends response to user on WhatsApp</p>
        </div>
      </div>
    </div>
  )
}
