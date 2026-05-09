import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

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

    let gatewayUrl = process.env.WHATSAPP_GATEWAY_URL
    if (!gatewayUrl) {
      return NextResponse.json(
        { error: 'Gateway URL not configured. Please set WHATSAPP_GATEWAY_URL environment variable.' },
        { status: 500 }
      )
    }

    // Ensure URL has protocol
    if (!gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
      gatewayUrl = `https://${gatewayUrl}`
    }
    
    // Remove trailing slash
    gatewayUrl = gatewayUrl.replace(/\/$/, '')

    console.log('[initiate] Gateway URL:', gatewayUrl)
    console.log('[initiate] User ID:', userId)

    // Create axios instance with SSL verification disabled for self-signed certs
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })

    // Call aromsg gateway to create/restore session
    const response = await axios.post(
      `${gatewayUrl}/connect`,
      { userId },
      { 
        timeout: 15000,
        httpsAgent,
      }
    )

    console.log('[initiate] Gateway response:', response.status, response.data)

    // Get QR code
    let qrCode = null
    try {
      const qrResponse = await axios.get(
        `${gatewayUrl}/qr/${userId}`,
        { 
          timeout: 5000,
          httpsAgent,
        }
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
    console.error('[initiate] Full error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[initiate] Error message:', errorMessage)
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: 'Failed to connect to WhatsApp gateway',
      },
      { status: 500 }
    )
  }
}
