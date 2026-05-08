import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/whatsapp/disconnect
 * Proxies disconnect request to bot server
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const botServerUrl = process.env.BOT_SERVER_URL || 'http://localhost:3001'
    const response = await fetch(`${botServerUrl}/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[disconnect-whatsapp] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect WhatsApp' },
      { status: 500 }
    )
  }
}
