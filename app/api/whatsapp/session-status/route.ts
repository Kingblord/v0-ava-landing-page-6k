import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

/**
 * GET /api/whatsapp/session-status?userId=...
 * Gets the current session status from aromsg gateway
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

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

    const response = await axios.get(
      `${gatewayUrl}/status/${userId}`,
      { timeout: 5000 }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('[session-status] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
