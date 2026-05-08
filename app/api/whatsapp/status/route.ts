import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/whatsapp/status
 * Returns current WhatsApp session status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // TODO: Implement status check
    // 1. Query Firestore for session document
    // 2. Check if connection is active
    // 3. Return current status (connected | connecting | disconnected | reconnecting | qr_pending)
    // 4. Include phone number if connected

    return NextResponse.json({
      status: 'disconnected',
      phoneNumber: undefined,
      connected: false,
      lastConnected: undefined,
      reconnectAttempts: 0,
    })
  } catch (error) {
    console.error('[whatsapp-status] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
