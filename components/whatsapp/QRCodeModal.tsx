'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface QRCodeModalProps {
  isOpen: boolean
  qrCode?: string
  onClose: () => void
  loading?: boolean
}

export function QRCodeModal({ isOpen, qrCode, onClose, loading }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!qrCode || !isOpen) return

    // Convert QR code string to data URL using QR code library
    // For now, we'll create a simple implementation
    async function generateQR() {
      try {
        // Dynamic import of qrcode library
        const QRCode = require('qrcode')
        const dataUrl = await QRCode.toDataURL(qrCode, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.95,
          margin: 1,
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('[QRCodeModal] Failed to generate QR:', err)
      }
    }

    generateQR()
  }, [qrCode, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111827] border border-[#6C5CE7]/30 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-lg">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="text-[#8892a4] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-full h-auto" />
          ) : (
            <div className="w-64 h-64 bg-[#0d1120] rounded flex items-center justify-center">
              <p className="text-[#8892a4] text-sm">Loading QR code...</p>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4 p-3 bg-[#0d1120] rounded-lg">
          <p className="text-white text-sm font-medium">Steps:</p>
          <ol className="text-[#8892a4] text-xs space-y-2">
            <li>1. Open WhatsApp on your phone</li>
            <li>2. Go to Settings → Linked Devices</li>
            <li>3. Tap "Link a device"</li>
            <li>4. Point your phone at this screen to scan</li>
          </ol>
        </div>

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
          <p className="text-yellow-400 text-xs">QR code expires in 60 seconds. Refresh if needed.</p>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
          disabled={loading}
        >
          Done
        </Button>
      </div>
    </div>
  )
}
