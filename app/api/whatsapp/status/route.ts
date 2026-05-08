import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

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

    const service = WhatsAppService.getInstance()
    const status = await service.getStatus(userId)

    return NextResponse.json(status)
  } catch (error) {
    console.error('[whatsapp-status] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
