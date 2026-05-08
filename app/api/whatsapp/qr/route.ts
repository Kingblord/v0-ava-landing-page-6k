import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

/**
 * GET /api/whatsapp/qr
 * Returns current QR code for scanning
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const service = WhatsAppService.getInstance()
    const qrData = await service.getQR(userId)

    return NextResponse.json(qrData)
  } catch (error) {
    console.error('[whatsapp-qr] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get QR code' },
      { status: 500 }
    )
  }
}
