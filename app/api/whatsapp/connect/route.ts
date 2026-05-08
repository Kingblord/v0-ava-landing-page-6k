import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

/**
 * POST /api/whatsapp/connect
 * Initiates WhatsApp connection by creating a new Baileys session
 * Returns QR code for scanning
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const service = WhatsAppService.getInstance()
    await service.connect(userId)

    return NextResponse.json({
      success: true,
      status: 'qr_pending',
      message: 'WhatsApp connection initiated. Scan QR code.',
    })
  } catch (error) {
    console.error('[connect-whatsapp] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect WhatsApp' },
      { status: 500 }
    )
  }
}
