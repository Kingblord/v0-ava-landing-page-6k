import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

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

    let gatewayUrl = process.env.WHATSAPP_GATEWAY_URL
    if (!gatewayUrl) {
      return NextResponse.json(
        { error: 'Gateway URL not configured' },
        { status: 500 }
      )
    }
    
    // Ensure URL has protocol
    if (!gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
      gatewayUrl = `https://${gatewayUrl}`
    }
    
    // Remove trailing slash
    gatewayUrl = gatewayUrl.replace(/\/$/, '')

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })

    const response = await axios.get(
      `${gatewayUrl}/status/${userId}`,
      { 
        timeout: 5000,
        httpsAgent,
      }
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
