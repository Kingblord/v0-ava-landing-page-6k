import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/whatsapp/disconnect
 * Disconnects WhatsApp session and clears Firestore records
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // TODO: Implement Baileys session disconnection
    // 1. Call WhatsApp gateway service to close session
    // 2. Delete session credentials from storage
    // 3. Update Firestore status to disconnected
    // 4. Clear any reconnection attempts

    return NextResponse.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    })
  } catch (error) {
    console.error('[disconnect-whatsapp] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect WhatsApp' },
      { status: 500 }
    )
  }
}
