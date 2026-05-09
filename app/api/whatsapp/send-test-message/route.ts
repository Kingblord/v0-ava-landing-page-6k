import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

/**
 * POST /api/whatsapp/send-test-message
 * Sends a test message via aromsg gateway to verify connection
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, message } = await request.json()

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      )
    }

    let gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'https://aromsg.render.com'
    
    // Ensure URL has protocol
    if (!gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
      gatewayUrl = `https://${gatewayUrl}`
    }
    
    // Remove trailing slash
    gatewayUrl = gatewayUrl.replace(/\/$/, '')

    // Send message via aromsg gateway
    const response = await axios.post(
      `${gatewayUrl}/send-message`,
      { userId, message },
      { timeout: 10000 }
    )

    return NextResponse.json({
      success: true,
      message: 'Test message sent',
      data: response.data,
    })
  } catch (error) {
    console.error('[send-test-message] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
