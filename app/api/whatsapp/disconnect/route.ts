import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

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

    const service = WhatsAppService.getInstance()
    await service.disconnect(userId)

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
