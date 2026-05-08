import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

/**
 * POST /api/whatsapp/reconnect
 * Attempts to reconnect a disconnected WhatsApp session
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const service = WhatsAppService.getInstance()
    await service.reconnect(userId)

    return NextResponse.json({
      success: true,
      status: 'reconnecting',
      message: 'Attempting to reconnect WhatsApp session',
    })
  } catch (error) {
    console.error('[reconnect-whatsapp] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reconnect WhatsApp' },
      { status: 500 }
    )
  }
}
