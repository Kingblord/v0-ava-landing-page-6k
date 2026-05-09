import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

/**
 * GET /api/whatsapp/qr?userId=...
 * Gets the current QR code from aromsg gateway
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

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

    const response = await axios.get(
      `${gatewayUrl}/qr/${userId}`,
      { timeout: 5000 }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('[qr] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get QR code' },
      { status: 500 }
    )
  }
}
