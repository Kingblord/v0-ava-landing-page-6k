import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

/**
 * POST /api/whatsapp/initiate
 * Initiates a WhatsApp session with aromsg gateway
 * Returns status and QR code if available
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL
    if (!gatewayUrl) {
      return NextResponse.json(
        { error: 'Gateway not configured' },
        { status: 500 }
      )
    }

    // Call aromsg gateway to create/restore session
    const response = await axios.post(
      `${gatewayUrl}/connect`,
      { userId },
      { timeout: 10000 }
    )

    // Get QR code
    let qrCode = null
    try {
      const qrResponse = await axios.get(
        `${gatewayUrl}/qr/${userId}`,
        { timeout: 5000 }
      )
      qrCode = qrResponse.data.qr
    } catch (err) {
      console.warn(`[initiate] Could not fetch QR for ${userId}:`, err)
    }

    return NextResponse.json({
      success: true,
      userId,
      qrCode,
      message: 'Session initiated. Scan QR code to connect WhatsApp.',
    })
  } catch (error) {
    console.error('[initiate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate session' },
      { status: 500 }
    )
  }
}
