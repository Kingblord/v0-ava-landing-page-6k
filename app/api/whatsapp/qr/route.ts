import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/whatsapp/qr
 * Proxies QR code request to bot server
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const botServerUrl = process.env.BOT_SERVER_URL || 'http://localhost:3001'
    const response = await fetch(`${botServerUrl}/qr/${userId}`)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[whatsapp-qr] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get QR code' },
      { status: 500 }
    )
  }
}
