'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, CheckCheck, Wifi, WifiOff, BookOpen, Zap, QrCode } from 'lucide-react'

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [copied, setCopied] = useState(false)

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '/api/whatsapp/webhook'

  // Check initial status
  useEffect(() => {
    if (!user) return
    checkStatus()
  }, [user])

  // Poll for QR and connection updates
  useEffect(() => {
    if (!polling || !user) return

    const interval = setInterval(() => {
      checkStatus()
    }, 2000)

    return () => clearInterval(interval)
  }, [polling, user])

  async function checkStatus() {
    if (!user) return
    try {
      const res = await fetch(`/api/whatsapp/session-status?userId=${user.uid}`)
      const data = await res.json()

      if (data.connected) {
        setConnected(true)
        setPhoneNumber(data.phoneNumber)
        setPolling(false)
        setQrCode(null)
        toast.success('WhatsApp connected!')
      }
    } catch (err) {
      console.error('[check-status] Error:', err)
    }
  }

  async function handleConnect() {
    if (!user) return

    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      const data = await res.json()

      if (data.qrCode) {
        setQrCode(data.qrCode)
        setPolling(true)
        toast.info('QR code generated. Scan with WhatsApp Linked Devices.')
      } else {
        toast.error('Failed to generate QR code')
      }
    } catch (err) {
      console.error('[connect] Error:', err)
      toast.error('Failed to initiate connection')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!user) return

    setLoading(true)
    try {
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://aromsg.render.com'
      await fetch(`${gatewayUrl}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      setConnected(false)
      setPhoneNumber(null)
      setQrCode(null)
      setPolling(false)
      toast.success('Disconnected from WhatsApp')
    } catch (err) {
      console.error('[disconnect] Error:', err)
      toast.error('Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white">Please sign in</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">WhatsApp Integration</h1>
        <p className="text-[#8892a4] text-sm mt-1">Connect your WhatsApp to receive AI-powered messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Connection Panel */}
        <div className="space-y-6">
          {/* Status Card */}
          <div
            className={`rounded-2xl border p-6 ${
              connected
                ? 'bg-[#00D1B2]/8 border-[#00D1B2]/20'
                : 'bg-[#1a2235] border-[#6C5CE7]/15'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              {connected ? (
                <Wifi className="w-6 h-6 text-[#00D1B2]" />
              ) : (
                <WifiOff className="w-6 h-6 text-[#8892a4]" />
              )}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${connected ? 'text-[#00D1B2]' : 'text-[#8892a4]'}`}>
                  {connected ? 'Connected' : 'Not Connected'}
                </p>
                {phoneNumber && (
                  <p className="text-[#8892a4] text-xs mt-1">{phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!connected ? (
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="flex-1 bg-[#6C5CE7] hover:bg-[#5548c7] text-white rounded-lg"
                >
                  {loading ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-[#6C5CE7]/25 text-[#8892a4] hover:text-white rounded-lg"
                >
                  {loading ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}
            </div>
          </div>

          {/* QR Code Card */}
          {qrCode && (
            <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-4 h-4 text-[#6C5CE7]" />
                <h2 className="text-white font-semibold">Scan to Connect</h2>
              </div>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
              </div>
              <p className="text-[#8892a4] text-sm">
                Open WhatsApp → Settings → Linked Devices → Link a device and scan this QR code
              </p>
            </div>
          )}
        </div>

        {/* Right: Setup Info */}
        <div className="space-y-6">
          {/* Webhook URL */}
          <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Webhook URL</h2>
            <p className="text-[#8892a4] text-sm mb-4">
              This URL is already configured in the aromsg gateway to receive incoming messages.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0B0F1A] border border-[#6C5CE7]/20 rounded-lg px-3 py-2 text-[#00D1B2] text-xs font-mono truncate">
                {webhookUrl}
              </code>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="border-[#6C5CE7]/25 text-[#8892a4] hover:text-white rounded-lg"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#6C5CE7]" />
              <h2 className="text-white font-semibold">How It Works</h2>
            </div>
            <ol className="space-y-2 text-[#8892a4] text-sm">
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold">1.</span>
                <span>Click "Connect WhatsApp" to generate a QR code</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold">2.</span>
                <span>Scan with WhatsApp&apos;s Linked Devices</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold">3.</span>
                <span>aromsg gateway starts forwarding messages to us</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#6C5CE7] font-bold">4.</span>
                <span>AI processes and responds automatically</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
