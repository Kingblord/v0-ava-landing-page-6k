'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { MessageSquare, LogOut, RotateCcw, AlertCircle } from 'lucide-react'
import { formatWhatsAppStatus, WhatsAppAPI } from '@/lib/whatsapp-provider'
import type { WhatsAppStatus } from '@/lib/types'

interface WhatsAppConnectionCardProps {
  status: WhatsAppStatus
  phoneNumber?: string
  lastConnected?: number
  reconnectAttempts: number
  onConnect: () => void
  onDisconnect: () => void
  onReconnect: () => void
  loading: boolean
  error?: string
}

export function WhatsAppConnectionCard({
  status,
  phoneNumber,
  lastConnected,
  reconnectAttempts,
  onConnect,
  onDisconnect,
  onReconnect,
  loading,
  error,
}: WhatsAppConnectionCardProps) {
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting' || status === 'qr_pending' || status === 'reconnecting'

  return (
    <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#6C5CE7]/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#6C5CE7]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">WhatsApp Connection</h3>
            <p className="text-[#8892a4] text-sm">Link your WhatsApp account</p>
          </div>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}
        />
      </div>

      {/* Status Info */}
      <div className="space-y-3 mb-4 p-3 bg-[#0d1120] rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-[#8892a4] text-sm">Status</span>
          <span className="text-white font-medium">{formatWhatsAppStatus(status)}</span>
        </div>
        {phoneNumber && (
          <div className="flex justify-between items-center">
            <span className="text-[#8892a4] text-sm">Phone Number</span>
            <span className="text-white font-medium">{phoneNumber}</span>
          </div>
        )}
        {lastConnected && (
          <div className="flex justify-between items-center">
            <span className="text-[#8892a4] text-sm">Last Connected</span>
            <span className="text-white text-sm">{formatDistanceToNow(new Date(lastConnected), { addSuffix: true })}</span>
          </div>
        )}
        {reconnectAttempts > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[#8892a4] text-sm">Reconnect Attempts</span>
            <span className="text-yellow-400 text-sm">{reconnectAttempts}</span>
          </div>
        )}
      </div>

      {/* Warning Message */}
      {isConnected && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-yellow-400 text-xs">Unofficial WhatsApp integrations may occasionally require reconnecting your session.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button
            onClick={onConnect}
            disabled={loading || isConnecting}
            className="flex-1 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner className="w-4 h-4" />
                Connecting...
              </>
            ) : (
              'Connect WhatsApp'
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={onReconnect}
              disabled={loading}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reconnect
                </>
              )}
            </Button>
            <Button
              onClick={onDisconnect}
              disabled={loading}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Info Text */}
      <p className="text-[#8892a4] text-xs mt-4">
        Use your existing WhatsApp account or WhatsApp Business account by linking it as a companion device. Scan the QR code with WhatsApp Linked Devices.
      </p>
    </div>
  )
}
