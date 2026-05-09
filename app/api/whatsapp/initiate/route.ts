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

    let gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'https://aromsg.render.com'
    
    // Ensure URL has protocol
    if (!gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
      gatewayUrl = `https://${gatewayUrl}`
    }
    
    // Remove trailing slash
    gatewayUrl = gatewayUrl.replace(/\/$/, '')

    console.log('[initiate] Using gateway URL:', gatewayUrl)

    // Call aromsg gateway to create/restore session
    const response = await axios.post(
      `${gatewayUrl}/connect`,
      { userId },
      { timeout: 10000 }
    )

    console.log('[initiate] Gateway response:', response.data)

    // Get QR code
    let qrCode = null
    try {
      const qrResponse = await axios.get(
        `${gatewayUrl}/qr/${userId}`,
        { timeout: 5000 }
      )
      qrCode = qrResponse.data.qr
      console.log('[initiate] Got QR code for user:', userId)
    } catch (err) {
      console.warn(`[initiate] Could not fetch QR for ${userId}:`, err instanceof Error ? err.message : err)
    }

    return NextResponse.json({
      success: true,
      userId,
      qrCode,
      message: 'Session initiated. Scan QR code to connect WhatsApp.',
    })
  } catch (error) {
    console.error('[initiate] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate session' },
      { status: 500 }
    )
  }
}
